using backend.DTO.Ticket;

namespace backend.Services.TicketUnassignment;

public interface ITicketUnassignmentService
{
    Task<bool> UnassignTicketAsync(
        Guid ticketId,
        TicketUnassignmentDto dto,
        Guid changedById,
        CancellationToken cancellationToken = default);
}
