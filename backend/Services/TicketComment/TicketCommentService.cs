using backend.Data;
using backend.DTO.Ticket;
using backend.Services.TicketAttachment;
using backend.Services.Notification;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.TicketComment;

public class TicketCommentService : ITicketCommentService
{
    private readonly AppDbContext _db;
    private readonly ITicketAttachmentService _attachmentService;
    private readonly INotificationService _notificationService;

    public TicketCommentService(
        AppDbContext db,
        ITicketAttachmentService attachmentService,
        INotificationService notificationService)
    {
        _db = db;
        _attachmentService = attachmentService;
        _notificationService = notificationService;
    }

    public async Task<IReadOnlyCollection<TicketCommentDto>> GetCommentsAsync(Guid ticketId, bool includeInternal, CancellationToken cancellationToken = default) =>
        await Query(includeInternal)
            .Where(x => x.TicketId == ticketId)
            .OrderBy(x => x.CreatedAt)
            .Select(GetMapExpression())
            .ToListAsync(cancellationToken);

    public async Task<TicketCommentDto?> GetCommentByIdAsync(Guid ticketId, Guid commentId, bool includeInternal, CancellationToken cancellationToken = default) =>
        await Query(includeInternal)
            .Where(x => x.TicketId == ticketId && x.Id == commentId)
            .Select(GetMapExpression())
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<TicketCommentDto?> AddCommentAsync(
        Guid ticketId,
        TicketCommentCreateDto dto,
        Guid userId,
        bool canManageAll,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _db.Tickets
            .Include(x => x.Status)
            .SingleOrDefaultAsync(
                x => x.Id == ticketId && !x.IsDeleted,
                cancellationToken);

        if (ticket is null) return null;

        var user = await _db.Users.AsNoTracking().SingleOrDefaultAsync(x => x.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException("Comment owner was not found.");

        var entity = new Entities.TicketComment
        {
            TicketId = ticketId,
            UserId = userId,
            Comment = dto.Comment.Trim(),
            IsInternal = canManageAll && dto.IsInternal,
            CreatedAt = DateTime.UtcNow
        };

        _db.TicketComments.Add(entity);

        var isAssignedTeamMember =
            ticket.AssignedToId.HasValue &&
            ticket.AssignedToId.Value == userId;

        var keepsCurrentStatus =
            ticket.Status.Name.Equals("On Hold", StringComparison.OrdinalIgnoreCase) ||
            ticket.Status.Name.Equals("Resolved", StringComparison.OrdinalIgnoreCase) ||
            ticket.Status.IsClosed ||
            ticket.ResolvedAt.HasValue ||
            ticket.ClosedAt.HasValue;

        if (isAssignedTeamMember &&
            !entity.IsInternal &&
            !keepsCurrentStatus &&
            !ticket.Status.Name.Equals("Waiting for User", StringComparison.OrdinalIgnoreCase))
        {
            var waitingForUserStatus = await _db.TicketStatuses
                .SingleOrDefaultAsync(
                    status => status.Name == "Waiting for User" && status.IsActive,
                    cancellationToken)
                ?? throw new InvalidOperationException("The active Waiting for User status was not found.");

            ticket.StatusId = waitingForUserStatus.Id;

            _db.TicketHistories.Add(new Entities.TicketHistory
            {
                TicketId = ticket.Id,
                ActionType = Entities.TicketHistoryActionType.StatusChanged,
                FieldName = "Status",
                OldValue = ticket.Status.Name,
                NewValue = waitingForUserStatus.Name,
                Description = "Automatically changed after the assigned team member replied.",
                ChangedById = userId,
                ChangedAt = entity.CreatedAt
            });
        }

        await _db.SaveChangesAsync(cancellationToken);

        var attachments = await _attachmentService.AddCommentAttachmentsAsync(ticketId, entity.Id, dto.Attachments, userId, cancellationToken);
        
        await _notificationService.NotifyCommentAddedAsync(ticketId, userId, entity.IsInternal, cancellationToken);

        var roleName = await (
            from ur in _db.UserRoles
            where ur.UserId == userId
            join r in _db.Roles on ur.RoleId equals r.Id
            select r.Name
        ).FirstOrDefaultAsync(cancellationToken);

        return new TicketCommentDto
        {
            Id = entity.Id,
            Comment = entity.Comment,
            CreatedById = userId,
            CreatedByName = user.Name + " " + user.LastName,
            CreatedByRole = roleName ?? "User",
            CreatedAt = entity.CreatedAt,
            EditedAt = entity.EditedAt,
            IsInternal = entity.IsInternal,
            Attachments = attachments.ToList()
        };
    }

    public async Task<TicketCommentDto?> UpdateCommentAsync(Guid ticketId, Guid commentId, TicketCommentUpdateDto dto, Guid userId, bool canManageAll, CancellationToken cancellationToken = default)
    {
        var entity = await _db.TicketComments
            .Include(x => x.User)
            .Include(x => x.Attachments)
            .SingleOrDefaultAsync(x => x.Id == commentId && x.TicketId == ticketId, cancellationToken);

        if (entity is null) return null;
        if (!canManageAll && entity.UserId != userId) throw new UnauthorizedAccessException("You can update only your own comment.");

        entity.Comment = dto.Comment.Trim();
        entity.IsInternal = canManageAll && dto.IsInternal;
        entity.EditedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        var roleName = await (
            from ur in _db.UserRoles
            where ur.UserId == entity.UserId
            join r in _db.Roles on ur.RoleId equals r.Id
            select r.Name
        ).FirstOrDefaultAsync(cancellationToken);

        return new TicketCommentDto
        {
            Id = entity.Id,
            Comment = entity.Comment,
            CreatedById = entity.UserId,
            CreatedByName = entity.User != null ? entity.User.Name + " " + entity.User.LastName : string.Empty,
            CreatedByRole = roleName ?? "User",
            CreatedAt = entity.CreatedAt,
            EditedAt = entity.EditedAt,
            IsInternal = entity.IsInternal,
            Attachments = entity.Attachments.Select(a => new TicketAttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                ContentType = a.ContentType,
                FileSize = a.FileSize,
                DownloadUrl = a.FilePath,
                Description = a.Description,
                CommentId = a.TicketCommentId,
                UploadedById = a.UploaderId,
                UploadedAt = a.UploadedAt
            }).ToList()
        };
    }

    public async Task<bool> DeleteCommentAsync(Guid ticketId, Guid commentId, Guid userId, bool canManageAll, CancellationToken cancellationToken = default)
    {
        var entity = await _db.TicketComments.Include(x => x.Attachments)
            .SingleOrDefaultAsync(x => x.Id == commentId && x.TicketId == ticketId, cancellationToken);

        if (entity is null) return false;
        if (!canManageAll && entity.UserId != userId) throw new UnauthorizedAccessException("You can delete only your own comment.");

        foreach (var attachment in entity.Attachments.ToList())
            await _attachmentService.DeleteAttachmentAsync(ticketId, attachment.Id, userId, true, cancellationToken);

        _db.TicketComments.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    private IQueryable<Entities.TicketComment> Query(bool includeInternal) =>
        _db.TicketComments.AsNoTracking().Where(x => includeInternal || !x.IsInternal);

    // SQL seviyesinde direkt JOIN ile rolu çeken projection
    private System.Linq.Expressions.Expression<Func<Entities.TicketComment, TicketCommentDto>> GetMapExpression()
    {
        return x => new TicketCommentDto
        {
            Id = x.Id,
            Comment = x.Comment,
            CreatedById = x.UserId,
            CreatedByName = x.User != null ? x.User.Name + " " + x.User.LastName : string.Empty,
            CreatedByRole = _db.UserRoles
                .Where(ur => ur.UserId == x.UserId)
                .Join(_db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                .FirstOrDefault() ?? "User",
            CreatedAt = x.CreatedAt,
            EditedAt = x.EditedAt,
            IsInternal = x.IsInternal,
            Attachments = x.Attachments.OrderBy(a => a.UploadedAt).Select(a => new TicketAttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                ContentType = a.ContentType,
                FileSize = a.FileSize,
                DownloadUrl = a.FilePath,
                Description = a.Description,
                CommentId = a.TicketCommentId,
                UploadedById = a.UploaderId,
                UploadedByName = a.Uploader != null ? a.Uploader.Name + " " + a.Uploader.LastName : string.Empty,
                UploadedAt = a.UploadedAt
            }).ToList()
        };
    }
}