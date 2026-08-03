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
