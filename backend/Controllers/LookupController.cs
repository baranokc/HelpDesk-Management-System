using backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LookupController : ControllerBase
{
    private readonly AppDbContext _context;

    public LookupController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories(CancellationToken cancellationToken)
    {
        var categories = await _context.TicketCategories
            .Select(c => new { c.Id, c.Name })
            .ToListAsync(cancellationToken);

        return Ok(categories);
    }

    [HttpGet("priorities")]
    public async Task<IActionResult> GetPriorities(CancellationToken cancellationToken)
    {
        var priorities = await _context.TicketPriorities
            .Select(p => new { p.Id, p.Name })
            .ToListAsync(cancellationToken);

        return Ok(priorities);
    }

    [HttpGet("impact-levels")]
    public async Task<IActionResult> GetImpactLevels(CancellationToken cancellationToken)
    {
        var impactLevels = await _context.ImpactLevels
            .Select(i => new { i.Id, i.Name })
            .ToListAsync(cancellationToken);

        return Ok(impactLevels);
    }

    [HttpGet("urgency-levels")]
    public async Task<IActionResult> GetUrgencyLevels(CancellationToken cancellationToken)
    {
        var urgencyLevels = await _context.UrgencyLevels
            .Select(u => new { u.Id, u.Name })
            .ToListAsync(cancellationToken);

        return Ok(urgencyLevels);
    }
}