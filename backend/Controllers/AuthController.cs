using backend.DTO.Auth;
using backend.Services.Auth;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/(controller)")]

public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    public AuthController(IAuthService authService)
    {
        _authService = authService;

    }
    public async Task<IActionResult> Register([FromBody] UserCreate dto)
    {
        var result = await _authService.RegisterAsync(dto);

        if (!result)
            return BadRequest(new { message = "This email is already used" });

        return Ok(new { message = "Username registration successful."});
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] Login dto)
    {
        var result = await _authService.LoginAsync(dto);

        if (result == null)
            return Unauthorized(new { message = "Incorrect Email/Passowrd" });

        return Ok(result);
    }
}


