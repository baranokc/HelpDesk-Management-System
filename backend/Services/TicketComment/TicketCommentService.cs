using backend.Data;
using backend.DTO.Ticket;
using backend.Services.TicketAttachment;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.TicketComment;

public class TicketCommentService : ITicketCommentService
{
    private readonly AppDbContext _db;
    private readonly ITicketAttachmentService _attachmentService;
    public TicketCommentService(AppDbContext db, ITicketAttachmentService attachmentService) { _db = db; _attachmentService = attachmentService; }

    public async Task<IReadOnlyCollection<TicketCommentDto>> GetCommentsAsync(Guid ticketId, bool includeInternal, CancellationToken cancellationToken = default) =>
        await Query(includeInternal).Where(x => x.TicketId == ticketId).OrderBy(x => x.CreatedAt)
            .Select(MapExpression).ToListAsync(cancellationToken);

    public async Task<TicketCommentDto?> GetCommentByIdAsync(Guid ticketId, Guid commentId, bool includeInternal, CancellationToken cancellationToken = default) =>
        await Query(includeInternal).Where(x => x.TicketId == ticketId && x.Id == commentId)
            .Select(MapExpression).SingleOrDefaultAsync(cancellationToken);

    public async Task<TicketCommentDto?> AddCommentAsync(Guid ticketId, TicketCommentCreateDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        if (!await _db.Tickets.AnyAsync(x => x.Id == ticketId && !x.IsDeleted, cancellationToken)) return null;
        var user = await _db.Users.AsNoTracking().SingleOrDefaultAsync(x => x.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException("Comment owner was not found.");
        var entity = new Entities.TicketComment { TicketId = ticketId, UserId = userId, Comment = dto.Comment.Trim(), IsInternal = dto.IsInternal, CreatedAt = DateTime.UtcNow };
        _db.TicketComments.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);
        var attachments = await _attachmentService.AddCommentAttachmentsAsync(ticketId, entity.Id, dto.Attachments, userId, cancellationToken);
        return new TicketCommentDto { Id = entity.Id, Comment = entity.Comment, CreatedById = userId, CreatedByName = user.Name + " " + user.LastName, CreatedAt = entity.CreatedAt, EditedAt = entity.EditedAt, IsInternal = entity.IsInternal, Attachments = attachments.ToList() };
    }

    public async Task<TicketCommentDto?> UpdateCommentAsync(Guid ticketId, Guid commentId, TicketCommentUpdateDto dto, Guid userId, bool canManageAll, CancellationToken cancellationToken = default)
    {
        var entity = await _db.TicketComments.Include(x => x.User).Include(x => x.Attachments)
            .SingleOrDefaultAsync(x => x.Id == commentId && x.TicketId == ticketId, cancellationToken);
        if (entity is null) return null;
        if (!canManageAll && entity.UserId != userId) throw new UnauthorizedAccessException("You can update only your own comment.");
        entity.Comment = dto.Comment.Trim();
        entity.IsInternal = canManageAll && dto.IsInternal;
        entity.EditedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return ToDto(entity);
    }

    public async Task<bool> DeleteCommentAsync(Guid ticketId, Guid commentId, Guid userId, bool canManageAll, CancellationToken cancellationToken = default)
    {
        var entity = await _db.TicketComments.Include(x => x.Attachments)
            .SingleOrDefaultAsync(x => x.Id == commentId && x.TicketId == ticketId, cancellationToken);
        if (entity is null) return false;
        if (!canManageAll && entity.UserId != userId) throw new UnauthorizedAccessException("You can delete only your own comment.");
        foreach (var attachment in entity.Attachments.ToList()) await _attachmentService.DeleteAttachmentAsync(ticketId, attachment.Id, userId, true, cancellationToken);
        _db.TicketComments.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    private IQueryable<Entities.TicketComment> Query(bool includeInternal) => _db.TicketComments.AsNoTracking().Where(x => includeInternal || !x.IsInternal);

    private static readonly System.Linq.Expressions.Expression<Func<Entities.TicketComment, TicketCommentDto>> MapExpression = x => new TicketCommentDto
    {
        Id = x.Id, Comment = x.Comment, CreatedById = x.UserId, CreatedByName = x.User.Name + " " + x.User.LastName,
        CreatedAt = x.CreatedAt, EditedAt = x.EditedAt, IsInternal = x.IsInternal,
        Attachments = x.Attachments.OrderBy(a => a.UploadedAt).Select(a => new TicketAttachmentDto { Id = a.Id, FileName = a.FileName, ContentType = a.ContentType, FileSize = a.FileSize, DownloadUrl = a.FilePath, CommentId = a.TicketCommentId, UploadedById = a.UploaderId, UploadedByName = a.Uploader.Name + " " + a.Uploader.LastName, UploadedAt = a.UploadedAt }).ToList()
    };

    private static TicketCommentDto ToDto(Entities.TicketComment x) => new()
    {
        Id = x.Id, Comment = x.Comment, CreatedById = x.UserId, CreatedByName = x.User.Name + " " + x.User.LastName,
        CreatedAt = x.CreatedAt, EditedAt = x.EditedAt, IsInternal = x.IsInternal,
        Attachments = x.Attachments.Select(a => new TicketAttachmentDto { Id = a.Id, FileName = a.FileName, ContentType = a.ContentType, FileSize = a.FileSize, DownloadUrl = a.FilePath, CommentId = a.TicketCommentId, UploadedById = a.UploaderId, UploadedAt = a.UploadedAt }).ToList()
    };
}
