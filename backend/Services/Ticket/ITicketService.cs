using backend.DTO.Common;
using backend.DTO.Ticket;

namespace backend.Services.Ticket;

public interface ITicketService
{
    Task<TicketPagedResultDto> GetTicketAsync(
        TicketFilterDto filter,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<TicketDetailDto?> GetTicketByAsync(
        Guid ticketId,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<bool> CanAccessTicketAsync(
        Guid ticketId,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<bool> CanProcessTicketAsync(
        Guid ticketId,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<TicketResponseDto> CreateTicketAsync(
        TicketCreateDto dto,
        Guid createdBy,
        CancellationToken cancellationToken = default);

    Task<TicketResponseDto?> UpdateTicketAsync(
        Guid ticketId,
        TicketUpdateDto dto,
        Guid changedByUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteTicketAsync(
        Guid ticketId,
        Guid deletedById,
        string currentUserRole,
        CancellationToken cancellationToken = default);

}
