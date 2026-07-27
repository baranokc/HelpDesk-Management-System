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
        Guid assignedByUserId, 
        CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(
        Guid ticketId, 
        TicketAssignmentDto dto, 
        Guid changedById, 
        CancellationToken cancellationToken = default);
    Task<TicketAssignmentResponseDto?> AssignTicketAsync(
        Guid ticketId, 
        TicketAssignmentDto dto,
        Guid assignedByUserId, 
        CancellationToken cancellationToken = default);
    Task<bool> UnassignTicketAsync(
        Guid ticketId, 
        TicketAssignmentDto dto, 
        Guid changedById, 
        CancellationToken cancellationToken = default);
    Task<TicketCommentDto?> AddCommentAsync(
        Guid ticketId, 
        TicketCommentCreateDto dto, 
        Guid userId, 
        CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<TicketAttachmentDto>> AddAttachmentAsync(
        Guid ticketId, 
        TicketAttachmentCreateDto dto, 
        Guid uploaderId, 
        CancellationToken cancellationToken = default);
    Task<bool> ResolveTicketAsync(
        Guid ticketId, 
        TicketResolveDto dto, 
        Guid resolvedById, 
        CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<TicketHistoryDto>> GetHistoryAsync(
        Guid ticketId, 
        CancellationToken cancellationToken = default);
    Task<bool> DeleteTicketAsync(
        Guid ticketId, 
        Guid deletedById, 
        CancellationToken cancellationToken = default);
}