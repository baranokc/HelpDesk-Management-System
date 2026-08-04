using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Entities;

namespace backend.Controllers;

[ApiController]
[Route("api/teams")]
[Authorize(Roles = "Admin")]
public class TeamController : ControllerBase
{
    private readonly AppDbContext _context;

    public TeamController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllTeams()
    {
        var teams = await _context.Teams
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                id = t.Id,
                name = t.Name,
                description = t.Description,
                leadId = t.LeadId,
                leadName = t.Lead != null 
                    ? (string.IsNullOrEmpty(t.Lead.LastName) ? t.Lead.Name : (t.Lead.Name + " " + t.Lead.LastName)) 
                    : null,
                memberCount = t.TeamMembers.Count,
                createdAt = t.CreatedAt
            })
            .ToListAsync();

        return Ok(teams);
    }

    [HttpGet("eligible-agents")]
    public async Task<IActionResult> GetEligibleAgents()
    {
        var agents = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Where(u => u.UserRoles.Any(ur => 
                ur.Role.Name.ToLower().Contains("agent") || 
                ur.Role.Name.ToLower().Contains("admin") ||
                ur.Role.Name.ToLower().Contains("support")))
            .Select(u => new
            {
                id = u.Id,
                fullName = string.IsNullOrEmpty(u.LastName) ? u.Name : (u.Name + " " + u.LastName),
                email = u.Email
            })
            .OrderBy(u => u.fullName)
            .ToListAsync();

        if (!agents.Any())
        {
            agents = await _context.Users
                .Select(u => new
                {
                    id = u.Id,
                    fullName = string.IsNullOrEmpty(u.LastName) ? u.Name : (u.Name + " " + u.LastName),
                    email = u.Email
                })
                .OrderBy(u => u.fullName)
                .ToListAsync();
        }

        return Ok(agents);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTeamById(Guid id)
    {
        var team = await _context.Teams
            .Where(t => t.Id == id)
            .Select(t => new
            {
                id = t.Id,
                name = t.Name,
                description = t.Description,
                leadId = t.LeadId,
                leadName = t.Lead != null 
                    ? (string.IsNullOrEmpty(t.Lead.LastName) ? t.Lead.Name : (t.Lead.Name + " " + t.Lead.LastName)) 
                    : null,
                memberCount = t.TeamMembers.Count,
                createdAt = t.CreatedAt,
                agents = t.TeamMembers
                    .Where(tm => tm.User != null)
                    .Select(tm => new
                    {
                        id = tm.User.Id,
                        fullName = string.IsNullOrEmpty(tm.User.LastName) 
                            ? tm.User.Name 
                            : (tm.User.Name + " " + tm.User.LastName),
                        email = tm.User.Email
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

        if (leadGuid.HasValue)
        {
            _context.TeamMembers.Add(new TeamMember
            {
                TeamId = team.Id,
                UserId = leadGuid.Value,
                JoinedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTeamById), new { id = team.Id }, new
        {
            id = team.Id,
            name = team.Name,
            description = team.Description,
            leadId = team.LeadId,
            memberCount = leadGuid.HasValue ? 1 : 0,
            createdAt = team.CreatedAt
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTeam(Guid id, [FromBody] UpdateTeamDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest("Team name cannot be empty.");
        }

        var team = await _context.Teams
            .Include(t => t.TeamMembers)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (team == null)
            return NotFound("Team not found.");

        team.Name = dto.Name.Trim();
        team.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();

        if (!string.IsNullOrEmpty(dto.LeadId) && Guid.TryParse(dto.LeadId, out var leadGuid))
        {
            team.LeadId = leadGuid;
            if (!team.TeamMembers.Any(tm => tm.UserId == leadGuid))
            {
                _context.TeamMembers.Add(new TeamMember
                {
                    TeamId = team.Id,
                    UserId = leadGuid,
                    JoinedAt = DateTime.UtcNow
                });
            }
        }
        else
        {
            team.LeadId = null;
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:guid}/members")]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] AddMemberDto dto)
    {
        if (!Guid.TryParse(dto.UserId, out var userGuid))
        {
            return BadRequest("Invalid User ID format.");
        }

        var teamExists = await _context.Teams.AnyAsync(t => t.Id == id);
        if (!teamExists) return NotFound("Team not found.");

        var alreadyMember = await _context.TeamMembers.AnyAsync(tm => tm.TeamId == id && tm.UserId == userGuid);
        if (alreadyMember) return BadRequest("User is already a member of this team.");

        _context.TeamMembers.Add(new TeamMember
        {
            TeamId = id,
            UserId = userGuid,
            JoinedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{id:guid}/members/{userId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid userId)
    {
        var member = await _context.TeamMembers.FirstOrDefaultAsync(tm => tm.TeamId == id && tm.UserId == userId);
        if (member == null) return NotFound("Team member not found.");

        var team = await _context.Teams.FirstOrDefaultAsync(t => t.Id == id);
        if (team != null && team.LeadId == userId)
        {
            team.LeadId = null;
        }

        _context.TeamMembers.Remove(member);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTeam(Guid id)
    {
        var team = await _context.Teams.FirstOrDefaultAsync(t => t.Id == id);
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

public class AddMemberDto
{
    public string UserId { get; set; } = string.Empty;
}