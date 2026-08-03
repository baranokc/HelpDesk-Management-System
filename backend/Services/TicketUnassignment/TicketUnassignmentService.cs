using backend.Data;
using backend.DTO.Ticket;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.TicketUnassignment;

public class TicketUnassignmentService : ITicketUnassignmentService
{
    private readonly AppDbContext _db;

    public TicketUnassignmentService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<bool> UnassignTicketAsync(
        Guid ticketId,
        TicketUnassignmentDto dto,
        Guid changedById,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _db.Tickets
            .Include(t => t.AssignedTo)
            .Include(t => t.Team)
            .FirstOrDefaultAsync(
                t => t.Id == ticketId && !t.IsDeleted,
                cancellationToken);

        if (ticket is null)
            return false;

        if (ticket.AssignedToId is null && ticket.TeamId is null)
            return false;

        var changedAt = DateTime.UtcNow;
        var oldAssignment = ticket.AssignedTo is not null
            ? $"{ticket.AssignedTo.Name} {ticket.AssignedTo.LastName}"
            : ticket.Team?.Name ?? "Unassigned";

        var remainingTeamName = ticket.Team?.Name;

        ticket.AssignedToId = null;

        if (!dto.KeepTeamAssignment)
            ticket.TeamId = null;

        _db.TicketHistories.Add(new Entities.TicketHistory
        {
            TicketId = ticket.Id,
            ActionType = Entities.TicketHistoryActionType.Unassigned,
            FieldName = "Assignment",
            OldValue = oldAssignment,
            NewValue = dto.KeepTeamAssignment && !string.IsNullOrWhiteSpace(remainingTeamName)
                ? $"Team: {remainingTeamName}"
                : "Unassigned",
            Description = string.IsNullOrWhiteSpace(dto.Reason)
                ? null
                : dto.Reason.Trim(),
            ChangedById = changedById,
            ChangedAt = changedAt
        });

        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
