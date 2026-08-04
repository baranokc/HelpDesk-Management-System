using System.Security.Claims;
using backend.Constants;
using backend.DTO.TeamManagement;
using backend.Services.TeamManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/team-management")]
public sealed class TeamManagementController : ControllerBase
{
    private readonly ITeamManagementService _teamManagementService;

    public TeamManagementController(
        ITeamManagementService teamManagementService)
    {
        _teamManagementService = teamManagementService;
    }

    private Guid CurrentUserId => Guid.TryParse(
        User.FindFirstValue(ClaimTypes.NameIdentifier) ??
        User.FindFirstValue("sub"),
        out var id)
            ? id
            : Guid.Empty;

    [HttpGet]
    [Authorize(Roles = Roles.TeamLeader)]
    [ProducesResponseType(
        typeof(TeamManagementOverviewDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetOverview(
        [FromQuery] Guid? teamId,
        CancellationToken cancellationToken)
    {
        if (CurrentUserId == Guid.Empty)
            return Unauthorized(new { message = "Invalid user identity." });

        try
        {
            return Ok(await _teamManagementService.GetOverviewAsync(
                CurrentUserId,
                teamId,
                cancellationToken));
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = exception.Message });
        }
    }

    [HttpGet("members/{teamMemberId:guid}")]
    [Authorize(Roles = Roles.TeamLeader)]
    [ProducesResponseType(
        typeof(TeamMemberDetailDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMemberDetail(
        Guid teamMemberId,
        [FromQuery] int activePageNumber = 1,
        [FromQuery] int inactivePageNumber = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken cancellationToken = default)
    {
        if (CurrentUserId == Guid.Empty)
            return Unauthorized(new { message = "Invalid user identity." });

        try
        {
            var result = await _teamManagementService.GetMemberDetailAsync(
                CurrentUserId,
                teamMemberId,
                activePageNumber,
                inactivePageNumber,
                pageSize,
                cancellationToken);

            return result is null
                ? NotFound(new { message = "Team member was not found." })
                : Ok(result);
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = exception.Message });
        }
    }

    [HttpGet("me")]
    [Authorize(Roles = Roles.SupportAgent)]
    [ProducesResponseType(
        typeof(TeamMemberDetailDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOwnMemberDetail(
        [FromQuery] int activePageNumber = 1,
        [FromQuery] int inactivePageNumber = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken cancellationToken = default)
    {
        if (CurrentUserId == Guid.Empty)
            return Unauthorized(new { message = "Invalid user identity." });

        var result = await _teamManagementService.GetOwnMemberDetailAsync(
            CurrentUserId,
            activePageNumber,
            inactivePageNumber,
            pageSize,
            cancellationToken);

        return result is null
            ? NotFound(new
            {
                message = "No active team membership was found for your account."
            })
            : Ok(result);
    }
}
