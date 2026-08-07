using System.Security.Claims;
using backend.Constants;
using backend.DTO.TeamChat;
using backend.Services.TeamChat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Authorize(Roles = Roles.TeamLeader + "," + Roles.SupportAgent)]
[ApiController]
[Route("api/team-chat")]
public sealed class TeamChatController : ControllerBase
{
    private readonly ITeamChatService _teamChatService;

    public TeamChatController(ITeamChatService teamChatService)
    {
        _teamChatService = teamChatService;
    }

    [HttpGet("rooms")]
    [ProducesResponseType(
        typeof(IReadOnlyCollection<TeamChatRoomDto>),
        StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRooms(
        CancellationToken cancellationToken)
    {
        if (CurrentUserId == Guid.Empty)
            return Unauthorized(new { message = "Invalid user identity." });

        return Ok(await _teamChatService.GetRoomsAsync(
            CurrentUserId,
            cancellationToken));
    }

    [HttpGet("rooms/{teamId:guid}/messages")]
    [ProducesResponseType(
        typeof(TeamChatMessagesPageDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMessages(
        Guid teamId,
        [FromQuery] DateTime? before = null,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        if (CurrentUserId == Guid.Empty)
            return Unauthorized(new { message = "Invalid user identity." });

        try
        {
            return Ok(await _teamChatService.GetMessagesAsync(
                CurrentUserId,
                teamId,
                before,
                limit,
                cancellationToken));
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = exception.Message });
        }
    }

    [HttpPost("rooms/{teamId:guid}/messages")]
    [ProducesResponseType(
        typeof(TeamChatMessageDto),
        StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> SendMessage(
        Guid teamId,
        [FromBody] CreateTeamChatMessageDto dto,
        CancellationToken cancellationToken)
    {
        if (CurrentUserId == Guid.Empty)
            return Unauthorized(new { message = "Invalid user identity." });

        try
        {
            var message = await _teamChatService.SendMessageAsync(
                CurrentUserId,
                teamId,
                dto,
                cancellationToken);

            return StatusCode(StatusCodes.Status201Created, message);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = exception.Message });
        }
    }

    private Guid CurrentUserId => Guid.TryParse(
        User.FindFirstValue(ClaimTypes.NameIdentifier) ??
        User.FindFirstValue("sub"),
        out var userId)
            ? userId
            : Guid.Empty;
}
