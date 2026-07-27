using backend.DTO.Ticket;

namespace backend.Services.TicketStatus;

public interface ITicketStatusService
{
    Task<bool> UpdateTicketStatusAsync(Guid ticketId, Guid newStatusId, Guid changedId, string? note = null);
    Task<List<TicketHistoryDto>> GetTicketHistoryDtosAsync(Guid ticketId);
}