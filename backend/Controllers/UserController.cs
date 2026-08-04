using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Entities;

namespace backend.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
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
    public async Task<IActionResult> UpdateUserRole(string id, [FromBody] UpdateRoleDto dto)
    {
        if (!Guid.TryParse(id, out var userGuid))
        {
            return BadRequest("Invalid User ID format.");
        }

        var user = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == userGuid);

        if (user == null)
            return NotFound("User not found.");

        var roleEntity = await _context.Roles
            .FirstOrDefaultAsync(r => r.Name.ToLower() == dto.NewRole.ToLower());

        if (roleEntity == null)
            return BadRequest("Invalid role name.");

        var existingUserRoles = await _context.UserRoles
            .Where(ur => ur.UserId == userGuid)
            .ToListAsync();

        _context.UserRoles.RemoveRange(existingUserRoles);

        _context.UserRoles.Add(new UserRole
        {
            UserId = userGuid,
            RoleId = roleEntity.Id,
            AssignedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return NoContent();
    }

    public class UpdateRoleDto
    {
        public string NewRole { get; set; } = string.Empty;
    }
}