using backend.Data;
using backend.DTO.Ticket;
using backend.Services.TicketAttachment;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.TicketComment;

public class TicketCommentService : ITicketCommentService
{
    private readonly AppDbContext _db;
    private readonly ITicketAttachmentService _attachmentService;

    public TicketCommentService(
        AppDbContext db,
        ITicketAttachmentService attachmentService)
    {
        _db = db;
        _attachmentService = attachmentService;
    }

    public async Task<TicketCommentDto?> AddCommentAsync(
        Guid ticketId,
        TicketCommentCreateDto dto,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var ticketExists = await _db.Tickets.AnyAsync(
            t => t.Id == ticketId && !t.IsDeleted,
            cancellationToken);

        if (!ticketExists)
            return null;

        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException("Comment owner was not found.");

        var comment = new Entities.TicketComment
        {
            TicketId = ticketId,
            UserId = userId,
            Comment = dto.Comment.Trim(),
            IsInternal = dto.IsInternal,
            CreatedAt = DateTime.UtcNow
        };

        _db.TicketComments.Add(comment);
        await _db.SaveChangesAsync(cancellationToken);

        var attachments = await _attachmentService.AddCommentAttachmentsAsync(
            ticketId,
            comment.Id,
            dto.Attachments,
            userId,
            cancellationToken);

        return new TicketCommentDto
        {
            Id = comment.Id,
            Comment = comment.Comment,
            CreatedById = userId,
            CreatedByName = $"{user.Name} {user.LastName}",
            CreatedAt = comment.CreatedAt,
            EditedAt = comment.EditedAt,
            IsInternal = comment.IsInternal,
            Attachments = attachments.ToList()
        };
    }
}
