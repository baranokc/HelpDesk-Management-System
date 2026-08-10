using backend.Data;
using backend.DTO.Ticket;
using backend.Services.TicketAttachment;
using backend.Services.Notification;
using backend.Services.Sla;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.TicketComment;

public class TicketCommentService : ITicketCommentService
{
    private readonly AppDbContext _db;
    private readonly ITicketAttachmentService _attachmentService;
    private readonly INotificationService _notificationService;
    private readonly ISlaService _slaService;

    public TicketCommentService(
        AppDbContext db,
        ITicketAttachmentService attachmentService,
        INotificationService notificationService,
        ISlaService slaService)
    {
        _db = db;
        _attachmentService = attachmentService;
        _notificationService = notificationService;
        _slaService = slaService;
    }

    public async Task<IReadOnlyCollection<TicketCommentDto>> GetCommentsAsync(Guid ticketId, bool includeInternal, CancellationToken cancellationToken = default) =>
        await Query(includeInternal).Where(x => x.TicketId == ticketId).OrderBy(x => x.CreatedAt)
            .Select(MapExpression).ToListAsync(cancellationToken);

    public async Task<TicketCommentDto?> GetCommentByIdAsync(Guid ticketId, Guid commentId, bool includeInternal, CancellationToken cancellationToken = default) =>
        await Query(includeInternal).Where(x => x.TicketId == ticketId && x.Id == commentId)
            .Select(MapExpression).SingleOrDefaultAsync(cancellationToken);

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

        var user = await _db.Users
            .AsNoTracking()
            .Include(item => item.Role)
            .SingleOrDefaultAsync(x => x.Id == userId, cancellationToken)
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

        var isTicketCreator = ticket.CreatedById == userId;

        var keepsCurrentStatus =
            ticket.Status.Name.Equals(
                "On Hold",
                StringComparison.OrdinalIgnoreCase) ||
            ticket.Status.Name.Equals(
                "Resolved",
                StringComparison.OrdinalIgnoreCase) ||
            ticket.Status.IsClosed ||
            ticket.ResolvedAt.HasValue ||
            ticket.ClosedAt.HasValue;

        var shouldPauseSla = false;
        var shouldResumeSla = false;

        if (isAssignedTeamMember &&
            !isTicketCreator &&
            !entity.IsInternal &&
            !keepsCurrentStatus &&
            !ticket.Status.Name.Equals(
                "Waiting for User",
                StringComparison.OrdinalIgnoreCase))
        {
            var waitingForUserStatus = await _db.TicketStatuses
                .SingleOrDefaultAsync(
                    status =>
                        status.Name == "Waiting for User" &&
                        status.IsActive,
                    cancellationToken)
                ?? throw new InvalidOperationException(
                    "The active Waiting for User status was not found.");

            var oldStatusName = ticket.Status.Name;
            ticket.StatusId = waitingForUserStatus.Id;
            shouldPauseSla = true;

            _db.TicketHistories.Add(new Entities.TicketHistory
            {
                TicketId = ticket.Id,
                ActionType = Entities.TicketHistoryActionType.StatusChanged,
                FieldName = "Status",
                OldValue = oldStatusName,
                NewValue = waitingForUserStatus.Name,
                Description =
                    "Automatically changed after the assigned team member replied.",
                ChangedById = userId,
                ChangedAt = entity.CreatedAt
            });
        }
        else if (isTicketCreator &&
                 !entity.IsInternal &&
                 !keepsCurrentStatus &&
                 ticket.Status.Name.Equals(
                     "Waiting for User",
                     StringComparison.OrdinalIgnoreCase))
        {
            var inProgressStatus = await _db.TicketStatuses
                .SingleOrDefaultAsync(
                    status =>
                        status.Name == "In Progress" &&
                        status.IsActive,
                    cancellationToken)
                ?? throw new InvalidOperationException(
                    "The active In Progress status was not found.");

            var oldStatusName = ticket.Status.Name;
            ticket.StatusId = inProgressStatus.Id;
            shouldResumeSla = true;

            _db.TicketHistories.Add(new Entities.TicketHistory
            {
                TicketId = ticket.Id,
                ActionType = Entities.TicketHistoryActionType.StatusChanged,
                FieldName = "Status",
                OldValue = oldStatusName,
                NewValue = inProgressStatus.Name,
                Description =
                    "Automatically changed after the ticket creator replied.",
                ChangedById = userId,
                ChangedAt = entity.CreatedAt
            });
        }

        var isPublicStaffResponse =
            canManageAll &&
            !entity.IsInternal &&
            ticket.CreatedById != userId;

        if (isPublicStaffResponse)
        {
            await _slaService.MarkFirstResponseAsync(
                ticket,
                entity.CreatedAt,
                cancellationToken);
        }

        var slaEventAt = new DateTimeOffset(
            DateTime.SpecifyKind(entity.CreatedAt, DateTimeKind.Utc),
            TimeSpan.Zero);

        if (shouldPauseSla)
        {
            await _slaService.PauseAsync(
                ticket,
                userId,
                "Waiting for a response from the ticket creator.",
                slaEventAt,
                cancellationToken);
        }
        else if (shouldResumeSla)
        {
            await _slaService.ResumeAsync(
                ticket,
                slaEventAt,
                cancellationToken);
        }

        // Tüm değişiklikler (Ticket.StatusId, Ticket.FirstResponseAt, Ticket.SlaDueAt, TicketComment, TicketHistory, SlaRecord)
        // tek bir güvenli veritabanı işleminde kaydediliyor.
        await _db.SaveChangesAsync(cancellationToken);

        var attachments = await _attachmentService.AddCommentAttachmentsAsync(ticketId, entity.Id, dto.Attachments, userId, cancellationToken);
        await _notificationService.NotifyCommentAddedAsync(
            ticketId,
            userId,
            entity.IsInternal,
            cancellationToken);

        return new TicketCommentDto
        {
            Id = entity.Id,
            Comment = entity.Comment,
            CreatedById = userId,
            CreatedByName = user.Name + " " + user.LastName,
            CreatedByAvatarUrl = string.IsNullOrWhiteSpace(user.AvatarFileName)
                ? null
                : $"/uploads/avatars/{user.AvatarFileName}",
            CreatedByRole = user.Role?.Name ?? "User",
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
                .ThenInclude(user => user.Role)
            .Include(x => x.Attachments)
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
        CreatedByAvatarUrl = x.User.AvatarFileName == null ? null : "/uploads/avatars/" + x.User.AvatarFileName,
        CreatedByRole = x.User.Role != null ? x.User.Role.Name : "User",
        CreatedAt = x.CreatedAt, EditedAt = x.EditedAt, IsInternal = x.IsInternal,
        Attachments = x.Attachments.OrderBy(a => a.UploadedAt).Select(a => new TicketAttachmentDto { Id = a.Id, FileName = a.FileName, ContentType = a.ContentType, FileSize = a.FileSize, DownloadUrl = a.FilePath, Description = a.Description, CommentId = a.TicketCommentId, UploadedById = a.UploaderId, UploadedByName = a.Uploader.Name + " " + a.Uploader.LastName, UploadedAt = a.UploadedAt }).ToList()
    };

    private static TicketCommentDto ToDto(Entities.TicketComment x) => new()
    {
        Id = x.Id, Comment = x.Comment, CreatedById = x.UserId, CreatedByName = x.User.Name + " " + x.User.LastName,
        CreatedByAvatarUrl = string.IsNullOrWhiteSpace(x.User.AvatarFileName) ? null : $"/uploads/avatars/{x.User.AvatarFileName}",
        CreatedByRole = x.User.Role?.Name ?? "User",
        CreatedAt = x.CreatedAt, EditedAt = x.EditedAt, IsInternal = x.IsInternal,
        Attachments = x.Attachments.Select(a => new TicketAttachmentDto { Id = a.Id, FileName = a.FileName, ContentType = a.ContentType, FileSize = a.FileSize, DownloadUrl = a.FilePath, Description = a.Description, CommentId = a.TicketCommentId, UploadedById = a.UploaderId, UploadedAt = a.UploadedAt }).ToList()
    };
}