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
            .FirstOrDefaultAsync(
                t => t.Id == ticketId && !t.IsDeleted,
                cancellationToken);

        if (ticket is null)
            return false;

        ticket.AssignedToId = null;

        if (!dto.KeepTeamAssignment)
            ticket.TeamId = null;

        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
