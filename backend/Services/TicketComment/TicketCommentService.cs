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
    private readonly ILogger<TicketCommentService> _logger;

    public TicketCommentService(
        AppDbContext db,
        ITicketAttachmentService attachmentService,
        INotificationService notificationService,
        ISlaService slaService,
        ILogger<TicketCommentService> logger)
    {
        _db = db;
        _attachmentService = attachmentService;
        _notificationService = notificationService;
        _slaService = slaService;
        _logger = logger;
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

        // The comment is the primary operation. Persist it before optional
        // workflow work so an SLA/status configuration problem cannot prevent
        // the user response from being recorded.
        await _db.SaveChangesAsync(cancellationToken);

        try
        {

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
                    cancellationToken);

            if (waitingForUserStatus is not null)
            {
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
            else
            {
                _logger.LogWarning(
                    "Ticket {TicketId} comment will be saved without an automatic status change because the active Waiting for User status was not found.",
                    ticket.Id);
            }
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
                    cancellationToken);

            if (inProgressStatus is not null)
            {
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
            else
            {
                _logger.LogWarning(
                    "Ticket {TicketId} comment will be saved without an automatic status change because the active In Progress status was not found.",
                    ticket.Id);
            }
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

        var hasUsableSlaRecord =
            (shouldPauseSla || shouldResumeSla) &&
            await HasUsableSlaRecordAsync(
                ticket.Id,
                cancellationToken);

        if (shouldPauseSla && hasUsableSlaRecord)
        {
            await _slaService.PauseAsync(
                ticket,
                userId,
                "Waiting for a response from the ticket creator.",
                slaEventAt,
                cancellationToken);
        }
        else if (shouldResumeSla && hasUsableSlaRecord)
        {
            await _slaService.ResumeAsync(
                ticket,
                slaEventAt,
                cancellationToken);
        }
        else if ((shouldPauseSla || shouldResumeSla) &&
                 !hasUsableSlaRecord)
        {
            _logger.LogInformation(
                "SLA pause/resume was skipped for ticket {TicketId} because no active SLA record with working periods is configured.",
                ticket.Id);
        }

            // Workflow changes remain atomic with each other, but are no longer
            // allowed to roll back or block the already persisted comment.
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Comment {CommentId} was saved, but ticket status/SLA automation failed for ticket {TicketId}.",
                entity.Id,
                ticket.Id);

            // Discard failed tracked workflow changes before attachments and
            // notifications use the same scoped DbContext.
            _db.ChangeTracker.Clear();
        }

        var attachments = await _attachmentService.AddCommentAttachmentsAsync(ticketId, entity.Id, dto.Attachments, userId, cancellationToken);
        try
        {
            await _notificationService.NotifyCommentAddedAsync(
                ticketId,
                userId,
                entity.IsInternal,
                cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Comment {CommentId} was saved, but its notification could not be created.",
                entity.Id);
        }

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

    private Task<bool> HasUsableSlaRecordAsync(
        Guid ticketId,
        CancellationToken cancellationToken)
    {
        return _db.SlaRecords
            .AsNoTracking()
            .AnyAsync(
                record =>
                    record.TicketId == ticketId &&
                    record.FirstResponseDueAt != default &&
                    record.ResolutionDueAt != default &&
                    record.SlaCalendar.IsActive &&
                    record.SlaCalendar.WorkingPeriods.Any(),
                cancellationToken);
    }

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
