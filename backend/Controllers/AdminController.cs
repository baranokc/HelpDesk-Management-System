using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;

namespace backend.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetOverviewStats()
    {
        var oneWeekAgo = DateTime.UtcNow.AddDays(-7);

        var totalUsers = await _context.Users.CountAsync(u => u.IsActive);
        var usersThisWeek = await _context.Users.CountAsync(u => u.IsActive && u.CreatedAt >= oneWeekAgo);

        var activeTeams = await _context.Teams.CountAsync(t => t.IsActive);

        var isDbConnected = await _context.Database.CanConnectAsync();

        return Ok(new
        {
            totalUsers,
            usersThisWeek,
            activeTeams,
            categoriesCount = 0, 
            subcategoriesCount = 0,
            systemStatus = isDbConnected ? "Healthy" : "Degraded"
        });
    }
}