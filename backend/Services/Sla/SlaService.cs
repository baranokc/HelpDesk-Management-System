using backend.Data;
using backend.Entities;
using Microsoft.EntityFrameworkCore;
using SlaRecordEntity = global::backend.Entities.SlaRecord;
using TicketEntity = global::backend.Entities.Ticket;

namespace backend.Services.Sla;

public class SlaService : ISlaService
{
    private readonly AppDbContext _context;
    private readonly IBusinessTimeCalculator _businessTimeCalculator;

    public SlaService(
        AppDbContext context,
        IBusinessTimeCalculator businessTimeCalculator)
    {
        _context = context;
        _businessTimeCalculator = businessTimeCalculator;
    }

    public async Task<SlaRecordEntity> StartSlaAsync(
        TicketEntity ticket,
        CancellationToken cancellationToken = default)
    {
        var trackedRecord = _context.SlaRecords.Local
            .SingleOrDefault(record => record.TicketId == ticket.Id);

        if (trackedRecord is not null)
            return trackedRecord;

        var existingRecord = await _context.SlaRecords
            .AsNoTracking()
            .SingleOrDefaultAsync(
                record => record.TicketId == ticket.Id,
                cancellationToken);

        if (existingRecord is not null)
            return existingRecord;

        var policy = await _context.SlaPolicies
            .AsNoTracking()
            .SingleOrDefaultAsync(
                item =>
                    item.PriorityId == ticket.PriorityId &&
                    item.IsActive,
                cancellationToken)
            ?? throw new InvalidOperationException(
                "No active SLA policy was found for the selected priority.");

        var calendar = await ResolveCalendarAsync(
            ticket.TeamId,
            cancellationToken);

        var createdAt = ToUtcOffset(ticket.CreatedAt);
        var firstResponseDueAt = _businessTimeCalculator.AddWorkingTime(
            createdAt,
            policy.FirstResponseTime,
            calendar);
        var resolutionDueAt = _businessTimeCalculator.AddWorkingTime(
            createdAt,
            policy.ResolutionTime,
            calendar);

        var record = new SlaRecordEntity
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            Ticket = ticket,
            SlaPolicyId = policy.Id,
            SlaCalendarId = calendar.Id,
            FirstResponseDueAt = firstResponseDueAt.UtcDateTime,
            ResolutionDueAt = resolutionDueAt.UtcDateTime,
            IsPaused = false,
            PauseReason = string.Empty,
            PausedAt = null,
            ResumedAt = null,
            RemainingFirstResponseTime = null,
            RemainingResolutionTime = null
        };

        ticket.SlaDueAt = record.ResolutionDueAt;
        _context.SlaRecords.Add(record);

        return record;
    }

    public async Task<bool> MarkFirstResponseAsync(
        TicketEntity ticket,
        DateTime respondedAt,
        CancellationToken cancellationToken = default)
    {
        var record = await GetRecordAsync(
            ticket.Id,
            cancellationToken);

        var existingResponseAt =
            ticket.FirstResponseAt ?? record?.FirstResponseAt;

        if (existingResponseAt.HasValue)
        {
            ticket.FirstResponseAt ??= existingResponseAt.Value;

            if (record is not null)
                record.FirstResponseAt ??= existingResponseAt.Value;

            return false;
        }

        ticket.FirstResponseAt = respondedAt;

        if (record is not null)
        {
            record.FirstResponseAt = respondedAt;
            record.RemainingFirstResponseTime = null;
        }

        return true;
    }

    public async Task<bool> CompleteResolutionAsync(
        TicketEntity ticket,
        DateTime resolvedAt,
        CancellationToken cancellationToken = default)
    {
        ticket.ResolvedAt ??= resolvedAt;

        var record = await GetRecordWithCalendarAsync(
            ticket.Id,
            cancellationToken);

        if (record is null || record.ResolutionAt.HasValue)
            return false;

        record.ResolutionAt = resolvedAt;
        record.RemainingResolutionTime = null;

        if (record.IsPaused)
            EndPause(record, resolvedAt);

        return true;
    }

    public async Task<bool> PauseAsync(
        TicketEntity ticket,
        Guid pausedById,
        string reason,
        DateTimeOffset pausedAt,
        CancellationToken cancellationToken = default)
    {
        var record = await GetRecordWithCalendarAsync(
            ticket.Id,
            cancellationToken);

        if (record is null ||
            record.IsPaused ||
            record.ResolutionAt.HasValue)
        {
            return false;
        }

        var pausedAtUtc = pausedAt.ToUniversalTime();
        var pausedAtDateTime = pausedAtUtc.UtcDateTime;

        record.RemainingFirstResponseTime =
            record.FirstResponseAt.HasValue
                ? null
                : CalculateRemainingTime(
                    pausedAtUtc,
                    record.FirstResponseDueAt,
                    record.SlaCalendar);

        record.RemainingResolutionTime = CalculateRemainingTime(
            pausedAtUtc,
            record.ResolutionDueAt,
            record.SlaCalendar);

        record.IsPaused = true;
        record.PauseReason = string.IsNullOrWhiteSpace(reason)
            ? "SLA paused."
            : reason.Trim();
        record.PausedAt = pausedAtDateTime;
        record.ResumedAt = null;

        record.Pauses.Add(new SlaPause
        {
            Id = Guid.NewGuid(),
            SlaRecordId = record.Id,
            PausedById = pausedById,
            Reason = record.PauseReason,
            PausedAt = pausedAtDateTime
        });

        return true;
    }

    public async Task<bool> ResumeAsync(
        TicketEntity ticket,
        DateTimeOffset resumedAt,
        CancellationToken cancellationToken = default)
    {
        var record = await GetRecordWithCalendarAsync(
            ticket.Id,
            cancellationToken);

        if (record is null || !record.IsPaused)
            return false;

        var resumedAtUtc = resumedAt.ToUniversalTime();

        if (!record.FirstResponseAt.HasValue &&
            record.RemainingFirstResponseTime is { } firstRemaining &&
            firstRemaining > TimeSpan.Zero)
        {
            record.FirstResponseDueAt = _businessTimeCalculator
                .AddWorkingTime(
                    resumedAtUtc,
                    firstRemaining,
                    record.SlaCalendar)
                .UtcDateTime;
        }

        if (!record.ResolutionAt.HasValue &&
            record.RemainingResolutionTime is { } resolutionRemaining &&
            resolutionRemaining > TimeSpan.Zero)
        {
            record.ResolutionDueAt = _businessTimeCalculator
                .AddWorkingTime(
                    resumedAtUtc,
                    resolutionRemaining,
                    record.SlaCalendar)
                .UtcDateTime;
            ticket.SlaDueAt = record.ResolutionDueAt;
        }

        EndPause(record, resumedAtUtc.UtcDateTime);
        return true;
    }

    private TimeSpan CalculateRemainingTime(
        DateTimeOffset pausedAtUtc,
        DateTime dueAt,
        SlaCalendar calendar)
    {
        var dueAtUtc = ToUtcOffset(dueAt);

        if (dueAtUtc <= pausedAtUtc)
            return TimeSpan.Zero;

        return _businessTimeCalculator.GetWorkingTime(
            pausedAtUtc,
            dueAtUtc,
            calendar);
    }

    private static void EndPause(
        SlaRecordEntity record,
        DateTime endedAt)
    {
        var activePause = record.Pauses
            .Where(pause => !pause.ResumedAt.HasValue)
            .OrderByDescending(pause => pause.PausedAt)
            .FirstOrDefault();

        if (activePause is not null)
            activePause.ResumedAt = endedAt;

        record.IsPaused = false;
        record.PauseReason = string.Empty;
        record.ResumedAt = endedAt;
        record.PausedAt = null;
        record.RemainingFirstResponseTime = null;
        record.RemainingResolutionTime = null;
    }

    private async Task<SlaCalendar> ResolveCalendarAsync(
        Guid? teamId,
        CancellationToken cancellationToken)
    {
        Guid? calendarId = null;

        if (teamId.HasValue)
        {
            calendarId = await _context.Teams
                .AsNoTracking()
                .Where(team =>
                    team.Id == teamId.Value &&
                    team.IsActive)
                .Select(team => team.SlaCalendarId)
                .SingleOrDefaultAsync(cancellationToken);
        }

        var query = _context.SlaCalendars
            .AsNoTracking()
            .AsSplitQuery()
            .Include(calendar => calendar.WorkingPeriods)
            .Include(calendar => calendar.Holidays)
            .Where(calendar => calendar.IsActive);

        var calendar = calendarId.HasValue
            ? await query.SingleOrDefaultAsync(
                item => item.Id == calendarId.Value,
                cancellationToken)
            : null;

        calendar ??= await query.SingleOrDefaultAsync(
            item => item.IsDefault,
            cancellationToken);

        return calendar ?? throw new InvalidOperationException(
            "No active SLA working calendar was found for the ticket team.");
    }

    private async Task<SlaRecordEntity?> GetRecordAsync(
        Guid ticketId,
        CancellationToken cancellationToken)
    {
        var trackedRecord = _context.SlaRecords.Local
            .SingleOrDefault(record => record.TicketId == ticketId);

        if (trackedRecord is not null)
            return trackedRecord;

        return await _context.SlaRecords.SingleOrDefaultAsync(
            record => record.TicketId == ticketId,
            cancellationToken);
    }

    private Task<SlaRecordEntity?> GetRecordWithCalendarAsync(
        Guid ticketId,
        CancellationToken cancellationToken)
    {
        return _context.SlaRecords
            .AsSplitQuery()
            .Include(record => record.SlaCalendar)
                .ThenInclude(calendar => calendar.WorkingPeriods)
            .Include(record => record.SlaCalendar)
                .ThenInclude(calendar => calendar.Holidays)
            .Include(record => record.Pauses)
            .SingleOrDefaultAsync(
                record => record.TicketId == ticketId,
                cancellationToken);
    }

    private static DateTimeOffset ToUtcOffset(DateTime value)
    {
        var utc = value.Kind == DateTimeKind.Utc
            ? value
            : DateTime.SpecifyKind(value, DateTimeKind.Utc);

        return new DateTimeOffset(utc, TimeSpan.Zero);
    }
}
