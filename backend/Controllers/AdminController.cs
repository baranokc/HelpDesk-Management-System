using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Security.Claims;
using backend.Constants;
using backend.Data;
using backend.Services.UserRoles;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = Roles.Admin)]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IUserRoleService _userRoleService;

    public AdminController(
        AppDbContext context,
        IUserRoleService userRoleService)
    {
        _context = context;
        _userRoleService = userRoleService;
    }

    // 1. ADMİN İSTATİSTİK ÖZETİ
    [HttpGet("stats")]
    public async Task<IActionResult> GetOverviewStats(CancellationToken cancellationToken)
    {
        var oneWeekAgo = DateTime.UtcNow.AddDays(-7);

        var totalUsers = await _context.Users.CountAsync(
            user => user.IsActive,
            cancellationToken);

        var usersThisWeek = await _context.Users.CountAsync(
            user =>
                user.IsActive &&
                user.CreatedAt >= oneWeekAgo,
            cancellationToken);

        var activeTeams = await _context.Teams.CountAsync(
            team => team.IsActive,
            cancellationToken);

        var categoriesCount = await _context.TicketCategories.CountAsync(
            category => category.IsActive,
            cancellationToken);

        var subcategoriesCount =
            await _context.TicketSubCategories.CountAsync(
                subcategory =>
                    subcategory.IsActive &&
                    subcategory.Category.IsActive,
                cancellationToken);

        var isDbConnected =
            await _context.Database.CanConnectAsync(cancellationToken);

        return Ok(new
        {
            totalUsers,
            usersThisWeek,
            activeTeams,
            categoriesCount,
            subcategoriesCount,
            systemStatus = isDbConnected ? "Healthy" : "Degraded"
        });
    }

    // 2. KULLANICI LİSTESİ (GET: api/admin/users)
    [HttpGet("users")]
public async Task<IActionResult> GetUsers(CancellationToken cancellationToken)
{
    var users = await _context.Users
        .AsNoTracking()
        .Where(u => u.IsActive)
        .Select(u => new
        {
            Id = u.Id,
            FullName = $"{u.Name} {u.LastName}".Trim(),
            Email = u.Email,
            Role = u.UserRoles
                .Where(userRole => userRole.Role.IsActive)
                .Select(userRole => userRole.Role.Name)
                .FirstOrDefault() ?? "User",

            // DÜZELTME: Dosya yoluna /uploads/avatars/ eklendi
            AvatarUrl = !string.IsNullOrEmpty(u.AvatarFileName) 
                ? $"/uploads/avatars/{u.AvatarFileName}" 
                : null,

            CreatedAt = u.CreatedAt
        })
        .ToListAsync(cancellationToken);

    return Ok(users);
}

    // 3. ROL GÜNCELLEME (PUT: api/admin/users/{id}/role)
    [HttpPut("users/{id}/role")]
    public async Task<IActionResult> UpdateUserRole(
        Guid id,
        [FromBody] UpdateRoleRequest request,
        CancellationToken cancellationToken)
    {
        var changedById = Guid.TryParse(
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub"),
            out var adminUserId)
                ? adminUserId
                : Guid.Empty;

        var result = await _userRoleService.UpdateUserRoleAsync(
            id,
            request.Role,
            changedById,
            cancellationToken);

        if (result.IsSuccess)
            return NoContent();

        return result.Status == UserRoleUpdateStatus.UserNotFound
            ? NotFound(new { message = result.Message })
            : BadRequest(new { message = result.Message });
    }

    // 4. KULLANICI SİLME (DELETE: api/admin/users/{id})
    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        user.IsActive = false;

        var userMemberships = await _context.TeamMembers
            .Where(tm => tm.UserId == id)
            .ToListAsync(cancellationToken);

        if (userMemberships.Any())
        {
            var memberIds = userMemberships.Select(tm => tm.Id).ToList();
            var assignments = await _context.TicketAssignments
                .Where(ta => ta.AssignedToId.HasValue && memberIds.Contains(ta.AssignedToId.Value))
                .ToListAsync(cancellationToken);

            if (assignments.Any())
            {
                _context.TicketAssignments.RemoveRange(assignments);
            }

            _context.TeamMembers.RemoveRange(userMemberships);
        }

        var leadTeams = await _context.Teams.Where(t => t.LeadId == id).ToListAsync(cancellationToken);
        foreach (var team in leadTeams)
        {
            team.LeadId = null;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}

public class UpdateRoleRequest
{
    public string Role { get; set; } = string.Empty;
}
