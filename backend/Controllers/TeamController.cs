using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Constants;
using backend.Data;
using backend.Entities;
using backend.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace backend.Controllers;

[ApiController]
[Route("api/teams")]
[Authorize(Roles = "Admin")]
public class TeamController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;

    public TeamController(
        AppDbContext context,
        IHubContext<NotificationHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
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
                memberCount = t.TeamMembers.Count(tm =>
                    tm.IsActive &&
                    tm.User.IsActive &&
                    tm.User.UserRoles.Any(userRole =>
                        userRole.Role.IsActive &&
                        (userRole.Role.Name == Roles.SupportAgent ||
                         userRole.Role.Name == Roles.TeamLeader))),
                createdAt = t.CreatedAt
            })
            .ToListAsync();

        return Ok(teams);
    }

    [HttpGet("eligible-agents")]
    public async Task<IActionResult> GetEligibleAgents()
    {
        var agents = await _context.Users
            .Where(u =>
                u.IsActive &&
                u.UserRoles.Any(userRole =>
                    userRole.Role.IsActive &&
                    (userRole.Role.Name == Roles.SupportAgent ||
                     userRole.Role.Name == Roles.TeamLeader)))
            .Select(u => new
            {
                id = u.Id,
                fullName = string.IsNullOrEmpty(u.LastName) ? u.Name : (u.Name + " " + u.LastName),
                email = u.Email
            })
            .OrderBy(u => u.fullName)
            .ToListAsync();

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
                memberCount = t.TeamMembers.Count(tm =>
                    tm.IsActive &&
                    tm.User.IsActive &&
                    tm.User.UserRoles.Any(userRole =>
                        userRole.Role.IsActive &&
                        (userRole.Role.Name == Roles.SupportAgent ||
                         userRole.Role.Name == Roles.TeamLeader))),
                createdAt = t.CreatedAt,
                agents = t.TeamMembers
                    .Where(tm =>
                        tm.IsActive &&
                        tm.User.IsActive &&
                        tm.User.UserRoles.Any(userRole =>
                            userRole.Role.IsActive &&
                            (userRole.Role.Name == Roles.SupportAgent ||
                             userRole.Role.Name == Roles.TeamLeader)))
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

        var team = new Team
        {
            Id = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
            LeadId = null,
            CreatedAt = DateTime.UtcNow
        };

        _context.Teams.Add(team);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTeamById), new { id = team.Id }, new
        {
            id = team.Id,
            name = team.Name,
            description = team.Description,
            leadId = team.LeadId,
            memberCount = 0,
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

        var team = await _context.Teams.FirstOrDefaultAsync(t => t.Id == id);
        if (team == null)
            return NotFound("Team not found.");

        team.Name = dto.Name.Trim();
        team.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id:guid}/lead")]
    public async Task<IActionResult> SetTeamLead(
        Guid id,
        [FromBody] SetLeadDto dto,
        CancellationToken cancellationToken)
    {
        await using var transaction = await _context.Database
            .BeginTransactionAsync(cancellationToken);

        var team = await _context.Teams
            .Include(t => t.TeamMembers)
                .ThenInclude(member => member.User)
            .FirstOrDefaultAsync(
                t => t.Id == id,
                cancellationToken);

        if (team == null)
            return NotFound("Team not found.");

        var previousLeadId = team.LeadId;
        Guid? nextLeadId = null;

        if (string.IsNullOrWhiteSpace(dto.LeadId))
        {
            nextLeadId = null;
        }
        else if (Guid.TryParse(dto.LeadId, out var leadGuid))
        {
            var selectedMember = team.TeamMembers.SingleOrDefault(member =>
                member.UserId == leadGuid &&
                member.IsActive &&
                member.User.IsActive);

            if (selectedMember is null)
            {
                return BadRequest("Selected team lead must be an active member of this team.");
            }

            nextLeadId = leadGuid;
            selectedMember.RoleInTeam = TeamMemberRole.TeamLeader;

            await SetSystemRoleAsync(
                leadGuid,
                Roles.TeamLeader,
                cancellationToken);
        }
        else
        {
            return BadRequest("Invalid Lead ID format.");
        }

        team.LeadId = nextLeadId;

        if (previousLeadId.HasValue &&
            previousLeadId != nextLeadId)
        {
            var previousMembership = team.TeamMembers
                .SingleOrDefault(member =>
                    member.UserId == previousLeadId.Value &&
                    member.IsActive);

            if (previousMembership is not null)
                previousMembership.RoleInTeam = TeamMemberRole.Member;

            var leadsAnotherTeam = await _context.TeamMembers
                .AnyAsync(member =>
                    member.UserId == previousLeadId.Value &&
                    member.TeamId != id &&
                    member.IsActive &&
                    member.Team.IsActive &&
                    member.RoleInTeam == TeamMemberRole.TeamLeader,
                    cancellationToken);

            if (!leadsAnotherTeam)
            {
                leadsAnotherTeam = await _context.Teams
                    .AnyAsync(otherTeam =>
                        otherTeam.Id != id &&
                        otherTeam.LeadId == previousLeadId.Value &&
                        otherTeam.IsActive,
                        cancellationToken);
            }

            if (!leadsAnotherTeam)
            {
                await SetSystemRoleAsync(
                    previousLeadId.Value,
                    Roles.SupportAgent,
                    cancellationToken);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var affectedUserIds = new HashSet<Guid>();
        if (nextLeadId.HasValue)
            affectedUserIds.Add(nextLeadId.Value);
        if (previousLeadId.HasValue)
            affectedUserIds.Add(previousLeadId.Value);

        foreach (var affectedUserId in affectedUserIds)
        {
            await _hubContext.Clients
                .User(affectedUserId.ToString())
                .SendAsync(
                    "SessionChanged",
                    new { reason = "TeamLeadershipChanged" },
                    cancellationToken);
        }

        return NoContent();
    }

    private async Task SetSystemRoleAsync(
        Guid userId,
        string roleName,
        CancellationToken cancellationToken)
    {
        var role = await _context.Roles
            .SingleAsync(
                item => item.Name == roleName && item.IsActive,
                cancellationToken);

        var user = await _context.Users
            .SingleAsync(
                item => item.Id == userId && item.IsActive,
                cancellationToken);

        user.RoleId = role.Id;

        var existingRoles = await _context.UserRoles
            .Where(userRole => userRole.UserId == userId)
            .ToListAsync(cancellationToken);

        _context.UserRoles.RemoveRange(existingRoles);
        _context.UserRoles.Add(new UserRole
        {
            UserId = userId,
            RoleId = role.Id,
            AssignedAt = DateTime.UtcNow
        });
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

        var existingMember = await _context.TeamMembers
            .FirstOrDefaultAsync(tm =>
                tm.TeamId == id &&
                tm.UserId == userGuid);

        if (existingMember?.IsActive == true)
            return BadRequest("User is already a member of this team.");

        if (existingMember is not null)
        {
            existingMember.IsActive = true;
            existingMember.RoleInTeam = TeamMemberRole.Member;
            existingMember.JoinedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok();
        }

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
}

public class UpdateTeamDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class SetLeadDto
{
    public string? LeadId { get; set; }
}

public class AddMemberDto
{
    public string UserId { get; set; } = string.Empty;
}
