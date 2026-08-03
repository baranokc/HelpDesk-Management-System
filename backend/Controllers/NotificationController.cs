using System.Security.Claims;
using backend.DTO.Notification;
using backend.Services.Notification;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/notifications")]
public sealed class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyCollection<NotificationDto>),
        StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool unreadOnly = false,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized(new { message = "Invalid user identity." });

        return Ok(await _notificationService.GetForUserAsync(
            userId,
            unreadOnly,
            limit,
            cancellationToken));
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount(
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized(new { message = "Invalid user identity." });

        var count = await _notificationService.GetUnreadCountAsync(
            userId,
            cancellationToken);

        return Ok(new { count });
    }

    [HttpPatch("{notificationId:guid}/read")]
    public async Task<IActionResult> MarkAsRead(
        Guid notificationId,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized(new { message = "Invalid user identity." });

        var updated = await _notificationService.MarkAsReadAsync(
            notificationId,
            userId,
            cancellationToken);

        return updated
            ? NoContent()
            : NotFound(new { message = "Notification was not found." });
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead(
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized(new { message = "Invalid user identity." });

        var updatedCount = await _notificationService.MarkAllAsReadAsync(
            userId,
            cancellationToken);

        return Ok(new { updatedCount });
    }

    private Guid GetCurrentUserId()
    {
        return Guid.TryParse(
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub"),
            out var userId)
            ? userId
            : Guid.Empty;
    }
}
