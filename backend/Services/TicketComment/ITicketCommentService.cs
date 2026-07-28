using backend.DTO.Ticket;

namespace backend.Services.TicketComment;

public interface ITicketCommentService
{
    Task<IReadOnlyCollection<TicketCommentDto>> GetCommentsAsync(Guid ticketId, bool includeInternal, CancellationToken cancellationToken = default);
    Task<TicketCommentDto?> GetCommentByIdAsync(Guid ticketId, Guid commentId, bool includeInternal, CancellationToken cancellationToken = default);
    Task<TicketCommentDto?> AddCommentAsync(Guid ticketId, TicketCommentCreateDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<TicketCommentDto?> UpdateCommentAsync(Guid ticketId, Guid commentId, TicketCommentUpdateDto dto, Guid userId, bool canManageAll, CancellationToken cancellationToken = default);
    Task<bool> DeleteCommentAsync(Guid ticketId, Guid commentId, Guid userId, bool canManageAll, CancellationToken cancellationToken = default);
}
