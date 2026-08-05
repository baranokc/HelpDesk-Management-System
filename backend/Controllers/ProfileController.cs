using System.Security.Claims;
using backend.DTO.Profile;
using backend.Services.Profile;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Authorize]
[Route("api/profile")]
public class ProfileController : ControllerBase
{
    private readonly IProfileService _profileService;

    public ProfileController(IProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ProfileDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProfile(CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Invalid user identity." });

        var profile = await _profileService.GetProfileAsync(
            userId,
            cancellationToken);

        return profile is null
            ? NotFound(new { message = "Profile was not found." })
            : Ok(profile);
    }

    [HttpPut]
    [ProducesResponseType(typeof(ProfileDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateProfileDto dto,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Invalid user identity." });

        var profile = await _profileService.UpdateProfileAsync(
            userId,
            dto,
            cancellationToken);

        return profile is null
            ? NotFound(new { message = "Profile was not found." })
            : Ok(profile);
    }

    [HttpPost("avatar")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ProfileDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UploadAvatar(
        [FromForm] AvatarUploadDto dto,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Invalid user identity." });

        try
        {
            var profile = await _profileService.UploadAvatarAsync(
                userId,
                dto.File,
                cancellationToken);

            return profile is null
                ? NotFound(new { message = "Profile was not found." })
                : Ok(profile);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpDelete("avatar")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteAvatar(
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Invalid user identity." });

        var deleted = await _profileService.DeleteAvatarAsync(
            userId,
            cancellationToken);

        return deleted
            ? NoContent()
            : NotFound(new { message = "Profile was not found." });
    }

    [HttpPut("password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordDto dto,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "Invalid user identity." });

        var result = await _profileService.ChangePasswordAsync(
            userId,
            dto,
            cancellationToken);

        return result switch
        {
            ChangePasswordResult.Success => NoContent(),
            ChangePasswordResult.UserNotFound =>
                NotFound(new { message = "Profile was not found." }),
            ChangePasswordResult.CurrentPasswordIncorrect =>
                BadRequest(new { message = "Current password is incorrect." }),
            ChangePasswordResult.NewPasswordMatchesCurrent =>
                BadRequest(new
                {
                    message = "New password must be different from the current password."
                }),
            _ => StatusCode(StatusCodes.Status500InternalServerError)
        };
    }

    private bool TryGetCurrentUserId(out Guid userId)
    {
        var userIdClaim =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        return Guid.TryParse(userIdClaim, out userId);
    }
}
