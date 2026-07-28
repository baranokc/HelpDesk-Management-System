using backend.DTO.Ticket;

namespace backend.Services.TicketAttachment;

public interface ITicketAttachmentService
{
    Task<IReadOnlyCollection<TicketAttachmentDto>> AddAttachmentAsync(
        Guid ticketId,
        TicketAttachmentCreateDto dto,
        Guid uploaderId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<TicketAttachmentDto>> AddCommentAttachmentsAsync(
        Guid ticketId,
        Guid commentId,
        IEnumerable<IFormFile> files,
        Guid uploaderId,
        CancellationToken cancellationToken = default);
}
