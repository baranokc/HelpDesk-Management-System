using backend.Data;
using backend.DTO.Ticket;
using backend.Entities;
using backend.Services.Notification;
using Microsoft.EntityFrameworkCore;



namespace backend.Services.TicketStatus;

public class TicketStatusService : ITicketStatusService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public TicketStatusService(
        AppDbContext context,
        INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
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

        ticket.StatusId = newStatusId;

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
            ChangedAt = DateTime.UtcNow
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
