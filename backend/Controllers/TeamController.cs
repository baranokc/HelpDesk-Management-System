using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Entities;

namespace backend.Controllers;

[ApiController]
[Route("api/teams")]
[Authorize(Roles = "Admin")]
public class TeamsController : ControllerBase
{
    private readonly AppDbContext _context;

    public TeamsController(AppDbContext context)
    {
        _context = context;
    }

    // 🟢 1. Tüm Ekipleri Getir
    [HttpGet]
    public async Task<IActionResult> GetAllTeams()
    {
        var teams = await _context.Teams
            .Select(t => new
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                LeadId = t.LeadId,
                LeadName = t.Lead != null 
                    ? (string.IsNullOrEmpty(t.Lead.LastName) ? t.Lead.Name : (t.Lead.Name + " " + t.Lead.LastName)) 
                    : null,
                MemberCount = t.TeamMembers.Count,
                CreatedAt = t.CreatedAt
            })
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return Ok(teams);
    }

    // 🟢 2. Tek Ekip Detayı Getir (Agents listesi ile)
    [HttpGet("{id}")]
    public async Task<IActionResult> GetTeamById(string id)
    {
        if (!Guid.TryParse(id, out var teamGuid))
        {
            return BadRequest("Invalid Team ID format.");
        }

        var team = await _context.Teams
            .Where(t => t.Id == teamGuid)
            .Select(t => new
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                LeadId = t.LeadId,
                LeadName = t.Lead != null 
                    ? (string.IsNullOrEmpty(t.Lead.LastName) ? t.Lead.Name : (t.Lead.Name + " " + t.Lead.LastName)) 
                    : null,
                MemberCount = t.TeamMembers.Count,
                CreatedAt = t.CreatedAt,
                Agents = t.TeamMembers
                    .Where(tm => tm.User != null)
                    .Select(tm => new
                    {
                        Id = tm.User.Id,
                        FullName = string.IsNullOrEmpty(tm.User.LastName) 
                            ? tm.User.Name 
                            : (tm.User.Name + " " + tm.User.LastName),
                        Email = tm.User.Email
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        if (team == null)
            return NotFound("Team not found.");

        return Ok(team);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTeam([FromBody] CreateTeamDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest("Team name is required.");
        }

        Guid? leadGuid = null;
        if (!string.IsNullOrEmpty(dto.LeadId) && Guid.TryParse(dto.LeadId, out var parsedLeadGuid))
        {
            leadGuid = parsedLeadGuid;
        }

        var team = new Team
        {
            Id = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
            LeadId = leadGuid,
            CreatedAt = DateTime.UtcNow
        };

        _context.Teams.Add(team);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTeamById), new { id = team.Id }, new
        {
            Id = team.Id,
            Name = team.Name,
            Description = team.Description,
            LeadId = team.LeadId,
            MemberCount = 0,
            CreatedAt = team.CreatedAt
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTeam(string id, [FromBody] UpdateTeamDto dto)
    {
        if (!Guid.TryParse(id, out var teamGuid))
        {
            return BadRequest("Invalid Team ID format.");
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest("Team name cannot be empty.");
        }

        var team = await _context.Teams.FirstOrDefaultAsync(t => t.Id == teamGuid);
        if (team == null)
            return NotFound("Team not found.");

        team.Name = dto.Name.Trim();
        team.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();

        if (!string.IsNullOrEmpty(dto.LeadId) && Guid.TryParse(dto.LeadId, out var leadGuid))
        {
            team.LeadId = leadGuid;
        }
        else
        {
            team.LeadId = null;
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTeam(string id)
    {
        if (!Guid.TryParse(id, out var teamGuid))
        {
            return BadRequest("Invalid Team ID format.");
        }

        var team = await _context.Teams.FirstOrDefaultAsync(t => t.Id == teamGuid);
        if (team == null)
            return NotFound("Team not found.");

        _context.Teams.Remove(team);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public class CreateTeamDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LeadId { get; set; }
}

public class UpdateTeamDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LeadId { get; set; }
}