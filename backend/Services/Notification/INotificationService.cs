using backend.DTO.Notification;

namespace backend.Services.Notification;

public interface INotificationService
{
    Task<IReadOnlyCollection<NotificationDto>> GetForUserAsync(
        Guid userId,
        bool unreadOnly,
        int limit,
        CancellationToken cancellationToken = default);

    Task<int> GetUnreadCountAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<bool> MarkAsReadAsync(
        Guid notificationId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<int> MarkAllAsReadAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task NotifyTeamLeadersOfNewTicketAsync(
        Guid ticketId,
        Guid actorUserId,
        CancellationToken cancellationToken = default);

    Task NotifyTicketAssignedAsync(
        Guid ticketId,
        Guid assignedToUserId,
        Guid actorUserId,
        CancellationToken cancellationToken = default);

    Task NotifyCommentAddedAsync(
        Guid ticketId,
        Guid commentAuthorId,
        bool isInternal,
        CancellationToken cancellationToken = default);

    Task NotifyTicketStatusChangedAsync(
        Guid ticketId,
        string statusName,
        Guid actorUserId,
        CancellationToken cancellationToken = default);

    Task NotifyTicketResolvedAsync(
        Guid ticketId,
        Guid actorUserId,
        CancellationToken cancellationToken = default);

    Task NotifyTicketClosedAsync(
        Guid ticketId,
        Guid actorUserId,
        CancellationToken cancellationToken = default);

    Task ProcessSlaAlertsAsync(
        CancellationToken cancellationToken = default);
}
