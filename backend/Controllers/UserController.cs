using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Services.UserRoles;

namespace backend.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IUserRoleService _userRoleService;

    public UsersController(
        AppDbContext context,
        IUserRoleService userRoleService)
    {
        _context = context;
        _userRoleService = userRoleService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _context.Users
            .Select(u => new
            {
                Id = u.Id,
                FullName = (u.Name + " " + u.LastName).Trim(), 
                Email = u.Email,
                Role = u.UserRoles
                    .Select(ur => ur.Role.Name)
                    .FirstOrDefault() ?? "User"
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPut("{id}/role")]
    public async Task<IActionResult> UpdateUserRole(
        string id,
        [FromBody] UpdateRoleDto dto,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(id, out var userGuid))
        {
            return BadRequest("Invalid User ID format.");
        }

        var changedById = Guid.TryParse(
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub"),
            out var adminUserId)
                ? adminUserId
                : Guid.Empty;

        var result = await _userRoleService.UpdateUserRoleAsync(
            userGuid,
            dto.NewRole,
            changedById,
            cancellationToken);

        if (result.IsSuccess)
            return NoContent();

        return result.Status == UserRoleUpdateStatus.UserNotFound
            ? NotFound(new { message = result.Message })
            : BadRequest(new { message = result.Message });
    }

    public class UpdateRoleDto
    {
        public string NewRole { get; set; } = string.Empty;
    }
}
