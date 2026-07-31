using backend.DTO.Ticket;

namespace backend.Services.TicketAttachment;

public interface ITicketAttachmentService
{
    Task<IReadOnlyCollection<TicketAttachmentDto>> GetAttachmentsAsync(Guid ticketId, Guid? commentId = null, bool includeInternal = false, CancellationToken cancellationToken = default);
    Task<TicketAttachmentDto?> GetAttachmentByIdAsync(Guid ticketId, Guid attachmentId, bool includeInternal = false, CancellationToken cancellationToken = default);
    Task<TicketAttachmentDownloadDto?> GetDownloadAsync(Guid ticketId, Guid attachmentId, bool includeInternal = false, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<TicketAttachmentDto>> AddAttachmentAsync(Guid ticketId, TicketAttachmentCreateDto dto, Guid uploaderId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<TicketAttachmentDto>> AddCommentAttachmentsAsync(Guid ticketId, Guid commentId, IEnumerable<IFormFile> files, Guid uploaderId, CancellationToken cancellationToken = default);
    Task<TicketAttachmentDto?> UpdateAttachmentAsync(Guid ticketId, Guid attachmentId, TicketAttachmentUpdateDto dto, Guid userId, bool canManageAll, CancellationToken cancellationToken = default);
    Task<bool> DeleteAttachmentAsync(Guid ticketId, Guid attachmentId, Guid userId, bool canManageAll, CancellationToken cancellationToken = default);
}
