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
}