using backend.Data;
using backend.DTO.Ticket;
using backend.Entities;
using backend.Services.Notification;
using backend.Services.Sla;
using Microsoft.EntityFrameworkCore;



namespace backend.Services.TicketStatus;

public class TicketStatusService : ITicketStatusService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ISlaService _slaService;

    public TicketStatusService(
        AppDbContext context,
        INotificationService notificationService,
        ISlaService slaService)
    {
        _context = context;
        _notificationService = notificationService;
        _slaService = slaService;
    }

    public async Task<bool> UpdateTicketStatusAsync(
        Guid ticketId,
        Guid newStatusId,
        Guid changedById,
        string? note = null,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Status)
            .FirstOrDefaultAsync(
                t => t.Id == ticketId && !t.IsDeleted,
                cancellationToken);

        if (ticket == null) return false;

        var newStatus = await _context.TicketStatuses
            .SingleOrDefaultAsync(status =>
                status.Id == newStatusId && status.IsActive,
                cancellationToken);

        if (newStatus == null) return false;

        if (ticket.StatusId == newStatusId) return true;

        if (ticket.Status.IsClosed ||
            ticket.ResolvedAt.HasValue ||
            ticket.ClosedAt.HasValue)
        {
            throw new InvalidOperationException(
                "A resolved or closed ticket requires a dedicated reopen workflow before its status can be changed.");
        }

        if (newStatus.Name.Equals("Resolved", StringComparison.OrdinalIgnoreCase) ||
            newStatus.Name.Equals("Closed", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Use the dedicated resolve/close workflow for this status.");
        }

        string oldStatusName = ticket.Status?.Name ?? "Didn't specified";
        string newStatusName = newStatus.Name;
        var changedAt = DateTime.UtcNow;
        var wasWaitingForUser = oldStatusName.Equals(
            "Waiting for User",
            StringComparison.OrdinalIgnoreCase);
        var isWaitingForUser = newStatusName.Equals(
            "Waiting for User",
            StringComparison.OrdinalIgnoreCase);

        ticket.StatusId = newStatusId;

        if (!wasWaitingForUser && isWaitingForUser)
        {
            await _slaService.PauseAsync(
                ticket,
                changedById,
                "Ticket status changed to Waiting for User.",
                ToUtcOffset(changedAt),
                cancellationToken);
        }
        else if (wasWaitingForUser && !isWaitingForUser)
        {
            await _slaService.ResumeAsync(
                ticket,
                ToUtcOffset(changedAt),
                cancellationToken);
        }

        var historyLog = new Entities.TicketHistory
        {
            Id = Guid.NewGuid(),
            TicketId = ticketId,
            ActionType = TicketHistoryActionType.StatusChanged,
            FieldName = "Status",
            OldValue = oldStatusName,
            NewValue = newStatusName,
            Description = string.IsNullOrWhiteSpace(note)
                ? null
                : note.Trim(),
            ChangedById = changedById,
            ChangedAt = changedAt
        };

        _context.TicketHistories.Add(historyLog);
        await _context.SaveChangesAsync(cancellationToken);
        await _notificationService.NotifyTicketStatusChangedAsync(
            ticket.Id,
            newStatusName,
            changedById,
            cancellationToken);

        return true;
    }

    private static DateTimeOffset ToUtcOffset(DateTime value)
    {
        return new DateTimeOffset(
            DateTime.SpecifyKind(value, DateTimeKind.Utc),
            TimeSpan.Zero);
    }

    public async Task<List<TicketHistoryDto>> GetTicketHistoryAsync(Guid ticketId)
    {
        return await _context.TicketHistories
            .Where(h => h.TicketId == ticketId)
            .OrderByDescending(h => h.ChangedAt)
            .Select(h => new TicketHistoryDto
            {
                Id = h.Id,
                TicketId = h.TicketId,
                ActionType = h.ActionType,
                FieldName = h.FieldName,
                OldValue = h.OldValue,
                NewValue = h.NewValue,
                Description = h.Description,
                ChangedById = h.ChangedById,
                ChangedByName = h.ChangedBy != null ? h.ChangedBy.Name : "Unknown",
                ChangedAt = h.ChangedAt
            })
            .ToListAsync();
    }

    public Task<List<TicketHistoryDto>>  GetTicketHistoryDtosAsync(Guid ticketId)
    {
        return GetTicketHistoryAsync(ticketId);
    }
}
