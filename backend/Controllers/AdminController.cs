using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using backend.Constants;
using backend.Data;
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

    public AdminController(AppDbContext context)
    {
        _context = context;
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
        .Include(u => u.Role)
        .AsNoTracking()
        .Where(u => u.IsActive)
        .Select(u => new
        {
            Id = u.Id,
            FullName = $"{u.Name} {u.LastName}".Trim(),
            Email = u.Email,
            Role = u.Role != null ? u.Role.Name : "User",

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
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        var currentRoleName = user.Role != null ? user.Role.Name : "User";
        var requestedRoleName = request.Role?.Trim() ?? "";

        // KONTROL 1: User Management üzerinden doğrudan TeamLeader verilemez
        if (string.Equals(requestedRoleName, "TeamLeader", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(currentRoleName, "TeamLeader", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Team leaders must be appointed from Team Management page." });
        }

        // Rolü güncelle
        var targetRole = await _context.Roles
            .FirstOrDefaultAsync(r => r.Name.ToLower() == requestedRoleName.ToLower(), cancellationToken);

        if (targetRole != null)
        {
            user.Role = targetRole;
        }

        // KONTROL 2: Kullanıcı rolü 'User'a düşürülürse takımlardan çıkar (FK Hatası Engellendi!)
        if (string.Equals(requestedRoleName, "User", StringComparison.OrdinalIgnoreCase))
        {
            var userMemberships = await _context.TeamMembers
                .Where(tm => tm.UserId == id)
                .ToListAsync(cancellationToken);

            if (userMemberships.Any())
            {
                var memberIds = userMemberships.Select(tm => tm.Id).ToList();

                // KRİTİK DÜZELTME: Postgres FK RESTRICT hatasını önlemek için bağlı TicketAssignments temizlenir
                var assignments = await _context.TicketAssignments
                    .Where(ta => memberIds.Contains(ta.AssignedToId))
                    .ToListAsync(cancellationToken);

                if (assignments.Any())
                {
                    _context.TicketAssignments.RemoveRange(assignments);
                }

                _context.TeamMembers.RemoveRange(userMemberships);
            }

            var leadTeams = await _context.Teams
                .Where(t => t.LeadId == id)
                .ToListAsync(cancellationToken);

            foreach (var team in leadTeams)
            {
                team.LeadId = null;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "User role updated successfully." });
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
                .Where(ta => memberIds.Contains(ta.AssignedToId))
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