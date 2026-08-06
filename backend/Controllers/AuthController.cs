using System.Security.Claims;
using backend.DTO.Auth;
using backend.Services.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]

public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    public AuthController(IAuthService authService)
    {
        _authService = authService;

    }
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] Login dto)
    {
        var result = await _authService.LoginAsync(dto);

        if (result == null)
            return Unauthorized(new { message = "Incorrect Email/Passowrd" });

        return Ok(result);
    }
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] UserCreate dto)
    {
        try
        {
            var result = await _authService.RegisterAsync(dto);

            if (!result)
            {
                return BadRequest(new
                {
                    message = "Email address is already in use."
                });
            }

            return Ok(new
            {
                message = "User registered successfully."
            });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest dto,
        CancellationToken cancellationToken)
    {
        await _authService.ForgotPasswordAsync(dto, cancellationToken);

        return Ok(new
        {
            message = "If an active account exists for this email address, a password reset link has been sent."
        });
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequest dto,
        CancellationToken cancellationToken)
    {
        var result = await _authService.ResetPasswordAsync(dto, cancellationToken);

        if (!result)
        {
            return BadRequest(new
            {
                message = "The password reset link is invalid, expired or has already been used."
            });
        }

        return Ok(new { message = "Your password has been reset successfully." });
    }

    [Authorize]
    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshSession()
    {
        var userIdClaim =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { message = "Invalid user identity." });

        var result = await _authService.RefreshSessionAsync(userId);

        return result is null
            ? Unauthorized(new { message = "The user session is no longer valid." })
            : Ok(result);
    }
}
