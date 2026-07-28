using backend.DTO.Ticket;

namespace backend.Services.TicketHistory;

public interface ITicketHistoryService
{
    Task<IReadOnlyCollection<TicketHistoryDto>> GetHistoryAsync(
        Guid ticketId,
        CancellationToken cancellationToken = default);
}
