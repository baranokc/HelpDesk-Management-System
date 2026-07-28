using backend.DTO.Ticket;

namespace backend.Services.TicketComment;

public interface ITicketCommentService
{
    Task<TicketCommentDto?> AddCommentAsync(
        Guid ticketId,
        TicketCommentCreateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default);
}
