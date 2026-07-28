using backend.DTO.Common;
using backend.DTO.Ticket;

namespace backend.Services.Ticket;

public interface ITicketService
{
    Task<PagedResultDto<TicketListDto>> GetTicketAsync(
        TicketFilterDto filter,
        CancellationToken cancellationToken = default);

    Task<TicketDetailDto?> GetTicketByAsync(
        Guid ticketId,
        CancellationToken cancellationToken = default);

    Task<TicketResponseDto> CreateTicketAsync(
        TicketCreateDto dto,
        Guid createdBy,
        CancellationToken cancellationToken = default);

    Task<TicketResponseDto?> UpdateTicketAsync(
        Guid ticketId,
        TicketUpdateDto dto,
        Guid changedByUserId,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteTicketAsync(
        Guid ticketId,
        Guid deletedById,
        CancellationToken cancellationToken = default);

}
