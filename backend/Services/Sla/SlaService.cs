using backend.Data;
using Microsoft.EntityFrameworkCore;
using SlaRecordEntity = global::backend.Entities.SlaRecord;
using TicketEntity = global::backend.Entities.Ticket;

namespace backend.Services.Sla;

public class SlaService : ISlaService
{
    private readonly AppDbContext _context;

    public SlaService(AppDbContext context)
    {
        _context = context;
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

        var record = new SlaRecordEntity
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            Ticket = ticket,
            SlaPolicyId = policy.Id,
            FirstResponseDueAt =
                ticket.CreatedAt.Add(policy.FirstResponseTime),
            ResolutionDueAt =
                ticket.CreatedAt.Add(policy.ResolutionTime),
            IsPaused = false,
            PauseReason = string.Empty,
            PausedAt = null,
            ResumedAt = null
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
            record.FirstResponseAt = respondedAt;

        return true;
    }

    public async Task<bool> CompleteResolutionAsync(
        TicketEntity ticket,
        DateTime resolvedAt,
        CancellationToken cancellationToken = default)
    {
        ticket.ResolvedAt ??= resolvedAt;

        var record = await GetRecordAsync(
            ticket.Id,
            cancellationToken);

        if (record is null || record.ResolutionAt.HasValue)
            return false;

        record.ResolutionAt = resolvedAt;
        return true;
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
}
