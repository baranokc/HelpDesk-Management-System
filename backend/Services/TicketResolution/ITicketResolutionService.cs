using backend.DTO.Ticket;

namespace backend.Services.TicketResolution;

public interface ITicketResolutionService
{
    Task<bool> ResolveTicketAsync(
        Guid ticketId,
        TicketResolveDto dto,
        Guid resolvedById,
        CancellationToken cancellationToken = default);
}
