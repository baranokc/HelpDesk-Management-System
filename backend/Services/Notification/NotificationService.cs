using backend.Constants;
using backend.Data;
using backend.DTO.Notification;
using backend.Entities;
using backend.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Notification;

public sealed class NotificationService : INotificationService
{
    private const string ClientEventName = "NotificationReceived";
    private static readonly TimeSpan SlaWarningWindow = TimeSpan.FromMinutes(15);

    private readonly AppDbContext _db;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        AppDbContext db,
        IHubContext<NotificationHub> hubContext,
        ILogger<NotificationService> logger)
    {
        _db = db;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task<IReadOnlyCollection<NotificationDto>> GetForUserAsync(
        Guid userId,
        bool unreadOnly,
        int limit,
        CancellationToken cancellationToken = default)
    {
        var query = _db.Notifications
            .AsNoTracking()
            .Where(notification => notification.UserId == userId);

        if (unreadOnly)
            query = query.Where(notification => !notification.IsRead);

        return await query
            .OrderByDescending(notification => notification.CreatedAt)
            .Take(Math.Clamp(limit, 1, 100))
            .Select(notification => new NotificationDto
            {
                Id = notification.Id,
                Type = notification.Type,
                Title = notification.Title,
                Message = notification.Message,
                TicketId = notification.TicketId,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt,
                ReadAt = notification.ReadAt
            })
            .ToListAsync(cancellationToken);
    }

    public Task<int> GetUnreadCountAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return _db.Notifications.CountAsync(
            notification =>
                notification.UserId == userId &&
                !notification.IsRead,
            cancellationToken);
    }

    public async Task<bool> MarkAsReadAsync(
        Guid notificationId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var notification = await _db.Notifications.SingleOrDefaultAsync(
            item => item.Id == notificationId && item.UserId == userId,
            cancellationToken);

        if (notification is null)
            return false;

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
        }

        return true;
    }

    public Task<int> MarkAllAsReadAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var readAt = DateTime.UtcNow;

        return _db.Notifications
            .Where(notification =>
                notification.UserId == userId &&
                !notification.IsRead)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(notification => notification.IsRead, true)
                    .SetProperty(
                        notification => notification.ReadAt,
                        (DateTime?)readAt),
                cancellationToken);
    }

    public async Task NotifyTeamLeadersOfNewTicketAsync(
        Guid ticketId,
        Guid actorUserId,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _db.Tickets
            .AsNoTracking()
            .Where(item =>
                item.Id == ticketId &&
                !item.IsDeleted &&
                item.TeamId.HasValue)
            .Select(item => new
            {
                item.Id,
                item.TicketNumber,
                item.TicketTitle,
                TeamId = item.TeamId!.Value,
                CategoryName = item.Category.Name
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (ticket is null)
            return;

        var leaderUserIds = await _db.TeamMembers
            .AsNoTracking()
            .Where(teamMember =>
                teamMember.TeamId == ticket.TeamId &&
                teamMember.RoleInTeam == TeamMemberRole.TeamLeader &&
                teamMember.IsActive &&
                teamMember.Team.IsActive &&
                teamMember.User.IsActive &&
                teamMember.User.Role != null &&
                teamMember.User.Role.Name == Roles.TeamLeader &&
                teamMember.User.Role.IsActive)
            .Select(teamMember => teamMember.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        await CreateAndSendAsync(
            leaderUserIds,
            actorUserId,
            NotificationTypes.TicketCreated,
            "New team ticket",
            $"{ticket.TicketNumber}: {ticket.TicketTitle} was opened in {ticket.CategoryName}.",
            ticket.Id,
            cancellationToken);
    }

    public async Task NotifyTicketAssignedAsync(
        Guid ticketId,
        Guid assignedToUserId,
        Guid actorUserId,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _db.Tickets
            .AsNoTracking()
            .Where(item => item.Id == ticketId && !item.IsDeleted)
            .Select(item => new
            {
                item.Id,
                item.TicketNumber,
                item.TicketTitle
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (ticket is null)
            return;

        await CreateAndSendAsync(
            [assignedToUserId],
            actorUserId,
            NotificationTypes.TicketAssigned,
            "Ticket assigned to you",
            $"{ticket.TicketNumber}: {ticket.TicketTitle} was assigned to you.",
            ticket.Id,
            cancellationToken);
    }

    public async Task NotifyCommentAddedAsync(
        Guid ticketId,
        Guid commentAuthorId,
        bool isInternal,
        CancellationToken cancellationToken = default)
    {
        if (isInternal)
            return;

        var ticket = await _db.Tickets
            .AsNoTracking()
            .Where(item => item.Id == ticketId && !item.IsDeleted)
            .Select(item => new
            {
                item.Id,
                item.TicketNumber,
                item.TicketTitle,
                item.CreatedById,
                item.AssignedToId
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (ticket is null)
            return;

        Guid? recipientUserId = null;

        if (ticket.AssignedToId == commentAuthorId &&
            ticket.CreatedById != commentAuthorId)
        {
            recipientUserId = ticket.CreatedById;
        }
        else if (ticket.CreatedById == commentAuthorId &&
                 ticket.AssignedToId.HasValue &&
                 ticket.AssignedToId.Value != commentAuthorId)
        {
            recipientUserId = ticket.AssignedToId.Value;
        }

        if (!recipientUserId.HasValue)
            return;

        var authorName = await _db.Users
            .AsNoTracking()
            .Where(user => user.Id == commentAuthorId)
            .Select(user => user.Name + " " + user.LastName)
            .SingleAsync(cancellationToken);

        await CreateAndSendAsync(
            [recipientUserId.Value],
            commentAuthorId,
            NotificationTypes.CommentAdded,
            "New ticket comment",
            $"{authorName} commented on {ticket.TicketNumber}: {ticket.TicketTitle}.",
            ticket.Id,
            cancellationToken);
    }

    public Task NotifyTicketStatusChangedAsync(
        Guid ticketId,
        string statusName,
        Guid actorUserId,
        CancellationToken cancellationToken = default)
    {
        return NotifyTicketCreatorAsync(
            ticketId,
            actorUserId,
            NotificationTypes.TicketStatusChanged,
            "Ticket status updated",
            (ticketNumber, ticketTitle) =>
                $"{ticketNumber}: {ticketTitle} status changed to {statusName}.",
            cancellationToken);
    }

    public Task NotifyTicketResolvedAsync(
        Guid ticketId,
        Guid actorUserId,
        CancellationToken cancellationToken = default)
    {
        return NotifyTicketCreatorAsync(
            ticketId,
            actorUserId,
            NotificationTypes.TicketResolved,
            "Ticket resolved",
            (ticketNumber, ticketTitle) =>
                $"{ticketNumber}: {ticketTitle} has been resolved.",
            cancellationToken);
    }

    public Task NotifyTicketClosedAsync(
        Guid ticketId,
        Guid actorUserId,
        CancellationToken cancellationToken = default)
    {
        return NotifyTicketCreatorAsync(
            ticketId,
            actorUserId,
            NotificationTypes.TicketClosed,
            "Ticket closed",
            (ticketNumber, ticketTitle) =>
                $"{ticketNumber}: {ticketTitle} has been closed.",
            cancellationToken);
    }

    public async Task ProcessSlaAlertsAsync(
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var warningCutoff = now.Add(SlaWarningWindow);

        var records = await _db.SlaRecords
            .AsNoTracking()
            .Where(record =>
                !record.IsPaused &&
                !record.Ticket.IsDeleted &&
                !record.Ticket.Status.IsClosed &&
                record.ResolutionAt == null &&
                ((record.FirstResponseAt == null &&
                  record.FirstResponseDueAt <= warningCutoff) ||
                 record.ResolutionDueAt <= warningCutoff))
            .Select(record => new
            {
                record.TicketId,
                record.Ticket.TicketNumber,
                record.Ticket.TicketTitle,
                record.Ticket.TeamId,
                record.Ticket.AssignedToId,
                record.FirstResponseDueAt,
                record.FirstResponseAt,
                record.ResolutionDueAt
            })
            .ToListAsync(cancellationToken);

        if (records.Count == 0)
            return;

        var teamIds = records
            .Where(record => record.TeamId.HasValue)
            .Select(record => record.TeamId!.Value)
            .Distinct()
            .ToList();

        var leaderAssignments = await _db.TeamMembers
            .AsNoTracking()
            .Where(teamMember =>
                teamIds.Contains(teamMember.TeamId) &&
                teamMember.RoleInTeam == TeamMemberRole.TeamLeader &&
                teamMember.IsActive &&
                teamMember.Team.IsActive &&
                teamMember.User.IsActive &&
                teamMember.User.Role != null &&
                teamMember.User.Role.Name == Roles.TeamLeader &&
                teamMember.User.Role.IsActive)
            .Select(teamMember => new
            {
                teamMember.TeamId,
                teamMember.UserId
            })
            .ToListAsync(cancellationToken);

        var leadersByTeam = leaderAssignments
            .GroupBy(item => item.TeamId)
            .ToDictionary(
                group => group.Key,
                group => group
                    .Select(item => item.UserId)
                    .Distinct()
                    .ToList());

        foreach (var record in records)
        {
            var recipientUserIds = new HashSet<Guid>();

            if (record.AssignedToId.HasValue)
                recipientUserIds.Add(record.AssignedToId.Value);

            if (record.TeamId.HasValue &&
                leadersByTeam.TryGetValue(
                    record.TeamId.Value,
                    out var leaderUserIds))
            {
                recipientUserIds.UnionWith(leaderUserIds);
            }

            if (recipientUserIds.Count == 0)
                continue;

            if (!record.FirstResponseAt.HasValue &&
                record.FirstResponseDueAt <= warningCutoff)
            {
                await SendSlaAlertAsync(
                    recipientUserIds,
                    record.TicketId,
                    record.TicketNumber,
                    record.TicketTitle,
                    "first response",
                    record.FirstResponseDueAt,
                    now,
                    NotificationTypes.SlaFirstResponseDueSoon,
                    NotificationTypes.SlaFirstResponseBreached,
                    cancellationToken);
            }

            if (record.ResolutionDueAt <= warningCutoff)
            {
                await SendSlaAlertAsync(
                    recipientUserIds,
                    record.TicketId,
                    record.TicketNumber,
                    record.TicketTitle,
                    "resolution",
                    record.ResolutionDueAt,
                    now,
                    NotificationTypes.SlaResolutionDueSoon,
                    NotificationTypes.SlaResolutionBreached,
                    cancellationToken);
            }
        }
    }

    private async Task NotifyTicketCreatorAsync(
        Guid ticketId,
        Guid actorUserId,
        string type,
        string title,
        Func<string, string, string> createMessage,
        CancellationToken cancellationToken)
    {
        var ticket = await _db.Tickets
            .AsNoTracking()
            .Where(item => item.Id == ticketId && !item.IsDeleted)
            .Select(item => new
            {
                item.Id,
                item.TicketNumber,
                item.TicketTitle,
                item.CreatedById
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (ticket is null)
            return;

        await CreateAndSendAsync(
            [ticket.CreatedById],
            actorUserId,
            type,
            title,
            createMessage(ticket.TicketNumber, ticket.TicketTitle),
            ticket.Id,
            cancellationToken);
    }

    private async Task SendSlaAlertAsync(
        IEnumerable<Guid> recipientUserIds,
        Guid ticketId,
        string ticketNumber,
        string ticketTitle,
        string targetName,
        DateTime dueAt,
        DateTime now,
        string dueSoonType,
        string breachedType,
        CancellationToken cancellationToken)
    {
        var isBreached = dueAt <= now;
        var type = isBreached ? breachedType : dueSoonType;
        var title = isBreached
            ? "SLA target breached"
            : "SLA target due soon";
        var message = isBreached
            ? $"The {targetName} SLA for {ticketNumber}: {ticketTitle} has been breached."
            : $"The {targetName} SLA for {ticketNumber}: {ticketTitle} is due within 15 minutes.";

        await CreateAndSendOnceAsync(
            recipientUserIds,
            type,
            title,
            message,
            ticketId,
            cancellationToken);
    }

    private async Task CreateAndSendOnceAsync(
        IEnumerable<Guid> recipientUserIds,
        string type,
        string title,
        string message,
        Guid ticketId,
        CancellationToken cancellationToken)
    {
        var recipients = recipientUserIds
            .Where(userId => userId != Guid.Empty)
            .Distinct()
            .ToList();

        if (recipients.Count == 0)
            return;

        var alreadyNotifiedUserIds = await _db.Notifications
            .AsNoTracking()
            .Where(notification =>
                notification.TicketId == ticketId &&
                notification.Type == type &&
                recipients.Contains(notification.UserId))
            .Select(notification => notification.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        await CreateAndSendAsync(
            recipients.Except(alreadyNotifiedUserIds),
            Guid.Empty,
            type,
            title,
            message,
            ticketId,
            cancellationToken);
    }

    private async Task CreateAndSendAsync(
        IEnumerable<Guid> recipientUserIds,
        Guid actorUserId,
        string type,
        string title,
        string message,
        Guid ticketId,
        CancellationToken cancellationToken)
    {
        var recipients = recipientUserIds
            .Where(userId => userId != Guid.Empty && userId != actorUserId)
            .Distinct()
            .ToList();

        if (recipients.Count == 0)
            return;

        var createdAt = DateTime.UtcNow;
        var notifications = recipients
            .Select(userId => new Entities.Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Type = type,
                Title = title,
                Message = message,
                TicketId = ticketId,
                CreatedAt = createdAt
            })
            .ToList();

        _db.Notifications.AddRange(notifications);
        await _db.SaveChangesAsync(cancellationToken);

        foreach (var notification in notifications)
        {
            try
            {
                await _hubContext.Clients
                    .User(notification.UserId.ToString())
                    .SendAsync(
                        ClientEventName,
                        ToDto(notification),
                        cancellationToken);
            }
            catch (Exception exception)
            {
                _logger.LogWarning(
                    exception,
                    "Notification {NotificationId} was persisted but could not be delivered in real time.",
                    notification.Id);
            }
        }
    }

    private static NotificationDto ToDto(Entities.Notification notification)
    {
        return new NotificationDto
        {
            Id = notification.Id,
            Type = notification.Type,
            Title = notification.Title,
            Message = notification.Message,
            TicketId = notification.TicketId,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt,
            ReadAt = notification.ReadAt
        };
    }
}
