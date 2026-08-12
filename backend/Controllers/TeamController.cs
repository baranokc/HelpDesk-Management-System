using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Constants;
using backend.Data;
using backend.Entities;
using backend.Hubs;
using Microsoft.AspNetCore.SignalR;
using Npgsql;

namespace backend.Controllers;

[ApiController]
[Route("api/teams")]
[Authorize(Roles = "Admin")]
public class TeamController : ControllerBase
{
    private const string SingleActiveTeamLeaderIndex =
        "IX_TeamMembers_OneActiveLeaderPerTeam";

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
        var teamRows = await _context.Teams
            .AsNoTracking()
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                id = t.Id,
                name = t.Name,
                description = t.Description,
                departmentId = t.DepartmentId,
                memberCount = t.TeamMembers.Count(tm =>
                    tm.IsActive &&
                    tm.User.IsActive &&
                    tm.User.UserRoles.Any(userRole =>
                        userRole.Role.IsActive &&
                        (userRole.Role.Name == Roles.SupportAgent ||
                         userRole.Role.Name == Roles.TeamLeader))),
                createdAt = t.CreatedAt,
                leaderCandidates = t.TeamMembers
                    .Where(tm =>
                        tm.IsActive &&
                        tm.User.IsActive &&
                        (tm.UserId == t.LeadId ||
                         tm.RoleInTeam == TeamMemberRole.TeamLeader) &&
                        tm.User.UserRoles.Any(userRole =>
                            userRole.Role.IsActive &&
                            userRole.Role.Name == Roles.TeamLeader))
                    .Select(tm => new
                    {
                        id = tm.UserId,
                        fullName = string.IsNullOrEmpty(tm.User.LastName)
                            ? tm.User.Name
                            : tm.User.Name + " " + tm.User.LastName,
                        isConfigured = t.LeadId == tm.UserId,
                        isDeclared =
                            tm.RoleInTeam == TeamMemberRole.TeamLeader
                    })
                    .ToList()
            })
            .ToListAsync();

        var teams = teamRows.Select(teamRow =>
        {
            var configuredLeader = teamRow.leaderCandidates
                .FirstOrDefault(candidate => candidate.isConfigured);

            var declaredLeaders = teamRow.leaderCandidates
                .Where(candidate => candidate.isDeclared)
                .ToList();

            var effectiveLeader = configuredLeader ??
                (declaredLeaders.Count == 1 ? declaredLeaders[0] : null);

            return new
            {
                teamRow.id,
                teamRow.name,
                teamRow.description,
                teamRow.departmentId,
                leadId = effectiveLeader?.id,
                leadName = effectiveLeader?.fullName,
                teamRow.memberCount,
                teamRow.createdAt
            };
        }).ToList();

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
                    userRole.Role.Name == Roles.SupportAgent))
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
        var teamRow = await _context.Teams
            .AsNoTracking()
            .Where(t => t.Id == id)
            .Select(t => new
            {
                id = t.Id,
                name = t.Name,
                description = t.Description,
                departmentId = t.DepartmentId,
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
                    .ToList(),
                leaderCandidates = t.TeamMembers
                    .Where(tm =>
                        tm.IsActive &&
                        tm.User.IsActive &&
                        (tm.UserId == t.LeadId ||
                         tm.RoleInTeam == TeamMemberRole.TeamLeader) &&
                        tm.User.UserRoles.Any(userRole =>
                            userRole.Role.IsActive &&
                            userRole.Role.Name == Roles.TeamLeader))
                    .Select(tm => new
                    {
                        id = tm.UserId,
                        fullName = string.IsNullOrEmpty(tm.User.LastName)
                            ? tm.User.Name
                            : tm.User.Name + " " + tm.User.LastName,
                        isConfigured = t.LeadId == tm.UserId,
                        isDeclared =
                            tm.RoleInTeam == TeamMemberRole.TeamLeader
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        if (teamRow == null)
            return NotFound("Team not found.");

        var configuredLeader = teamRow.leaderCandidates
            .FirstOrDefault(candidate => candidate.isConfigured);

        var declaredLeaders = teamRow.leaderCandidates
            .Where(candidate => candidate.isDeclared)
            .ToList();

        var effectiveLeader = configuredLeader ??
            (declaredLeaders.Count == 1 ? declaredLeaders[0] : null);

        var team = new
        {
            teamRow.id,
            teamRow.name,
            teamRow.description,
            teamRow.departmentId,
            leadId = effectiveLeader?.id,
            leadName = effectiveLeader?.fullName,
            teamRow.memberCount,
            teamRow.createdAt,
            teamRow.agents
        };

        return Ok(team);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTeam([FromBody] CreateTeamDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest("Team name is required.");
        }

        int? targetDepartmentId = dto.DepartmentId;
        if (!targetDepartmentId.HasValue || targetDepartmentId.Value <= 0)
        {
            targetDepartmentId = await _context.Departments
                .Select(d => (int?)d.Id)
                .FirstOrDefaultAsync();
        }

        var team = new Team
        {
            Id = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(dto.Description) ? string.Empty : dto.Description.Trim(),
            DepartmentId = targetDepartmentId ?? 0,
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
            departmentId = team.DepartmentId,
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
        team.Description = string.IsNullOrWhiteSpace(dto.Description) ? string.Empty : dto.Description.Trim();
        
        if (dto.DepartmentId.HasValue && dto.DepartmentId.Value > 0)
        {
            team.DepartmentId = dto.DepartmentId.Value;
        }

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

        var previousLeaderIds = team.TeamMembers
            .Where(member =>
                member.IsActive &&
                member.RoleInTeam == TeamMemberRole.TeamLeader)
            .Select(member => member.UserId)
            .ToHashSet();

        if (team.LeadId.HasValue && team.TeamMembers.Any(member =>
                member.UserId == team.LeadId.Value &&
                member.IsActive &&
                member.User.IsActive))
        {
            previousLeaderIds.Add(team.LeadId.Value);
        }

        Guid? nextLeadId;
        TeamMember? nextLeaderMembership = null;

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

            var isExistingLeader = previousLeaderIds.Contains(leadGuid);
            if (!isExistingLeader)
            {
                var isSupportAgent = await _context.UserRoles
                    .AsNoTracking()
                    .AnyAsync(userRole =>
                        userRole.UserId == leadGuid &&
                        userRole.Role.IsActive &&
                        userRole.Role.Name == Roles.SupportAgent,
                        cancellationToken);

                if (!isSupportAgent)
                {
                    return BadRequest(
                        "The new team leader must be an active SupportAgent member of this team.");
                }
            }

            nextLeadId = leadGuid;
            nextLeaderMembership = selectedMember;
        }
        else
        {
            return BadRequest("Invalid Lead ID format.");
        }

        try
        {
            // First remove the current leader. This must be saved separately
            // because PostgreSQL checks the filtered unique index per statement.
            // Promoting the new leader in the same SaveChanges call can otherwise
            // run before the demotion and cause a unique-constraint violation.
            foreach (var otherLeader in team.TeamMembers.Where(member =>
                         member.IsActive &&
                         member.RoleInTeam == TeamMemberRole.TeamLeader &&
                         member.UserId != nextLeadId))
            {
                otherLeader.RoleInTeam = TeamMemberRole.Member;
            }

            if (team.LeadId != nextLeadId)
                team.LeadId = null;

            foreach (var previousLeaderId in previousLeaderIds.Where(
                         userId => userId != nextLeadId))
            {
                var leadsAnotherTeam = await _context.TeamMembers
                    .AnyAsync(member =>
                        member.UserId == previousLeaderId &&
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
                            otherTeam.LeadId == previousLeaderId &&
                            otherTeam.IsActive,
                            cancellationToken);
                }

                if (!leadsAnotherTeam)
                {
                    await SetSystemRoleAsync(
                        previousLeaderId,
                        Roles.SupportAgent,
                        cancellationToken);
                }
            }

            await _context.SaveChangesAsync(cancellationToken);

            // The old leader no longer occupies the unique index. The selected
            // SupportAgent can now safely be promoted inside the same transaction.
            if (nextLeadId.HasValue && nextLeaderMembership is not null)
            {
                await SetSystemRoleAsync(
                    nextLeadId.Value,
                    Roles.TeamLeader,
                    cancellationToken);

                nextLeaderMembership.RoleInTeam =
                    TeamMemberRole.TeamLeader;
                team.LeadId = nextLeadId.Value;
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation,
                ConstraintName: SingleActiveTeamLeaderIndex
            })
        {
            await transaction.RollbackAsync(cancellationToken);
            return Conflict("This team already has an active team leader.");
        }

        var affectedUserIds = previousLeaderIds;
        if (nextLeadId.HasValue)
            affectedUserIds.Add(nextLeadId.Value);

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

        var targetUserRole = existingRoles.FirstOrDefault(
            userRole => userRole.RoleId == role.Id);

        _context.UserRoles.RemoveRange(existingRoles.Where(
            userRole => userRole.RoleId != role.Id));

        if (targetUserRole is null)
        {
            _context.UserRoles.Add(new UserRole
            {
                UserId = userId,
                RoleId = role.Id,
                AssignedAt = DateTime.UtcNow
            });
        }
        else
        {
            targetUserRole.AssignedAt = DateTime.UtcNow;
        }
    }

    [HttpPost("{id:guid}/members")]
    public async Task<IActionResult> AddMember(
        Guid id,
        [FromBody] AddMemberDto dto,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(dto.UserId, out var userGuid))
        {
            return BadRequest("Invalid User ID format.");
        }

        var teamExists = await _context.Teams.AnyAsync(
            team => team.Id == id && team.IsActive,
            cancellationToken);
        if (!teamExists) return NotFound("Team not found.");

        var isEligibleSupportAgent = await _context.Users
            .AsNoTracking()
            .AnyAsync(user =>
                user.Id == userGuid &&
                user.IsActive &&
                user.UserRoles.Any(userRole =>
                    userRole.Role.IsActive &&
                    userRole.Role.Name == Roles.SupportAgent),
                cancellationToken);

        if (!isEligibleSupportAgent)
        {
            return BadRequest(
                "Only active SupportAgent users can be added as team members. " +
                "TeamLeader users cannot be added as regular team members.");
        }

        var existingMember = await _context.TeamMembers
            .Include(member => member.Shifts)
            .FirstOrDefaultAsync(tm =>
                tm.TeamId == id &&
                tm.UserId == userGuid,
                cancellationToken);

        if (existingMember?.IsActive == true)
            return BadRequest("User is already a member of this team.");

        if (existingMember is not null)
        {
            existingMember.IsActive = true;
            existingMember.RoleInTeam = TeamMemberRole.Member;
            existingMember.JoinedAt = DateTime.UtcNow;

            if (existingMember.Shifts.Count == 0)
                AddDefaultShifts(existingMember);

            await _context.SaveChangesAsync(cancellationToken);
            return Ok();
        }

        var newMember = new TeamMember
        {
            TeamId = id,
            UserId = userGuid,
            JoinedAt = DateTime.UtcNow
        };

        AddDefaultShifts(newMember);
        _context.TeamMembers.Add(newMember);

        await _context.SaveChangesAsync(cancellationToken);
        return Ok();
    }

    private static void AddDefaultShifts(TeamMember member)
    {
        var workingDays = new[]
        {
            DayOfWeek.Monday,
            DayOfWeek.Tuesday,
            DayOfWeek.Wednesday,
            DayOfWeek.Thursday,
            DayOfWeek.Friday
        };

        foreach (var day in workingDays)
        {
            member.Shifts.Add(new TeamMemberShift
            {
                Id = Guid.NewGuid(),
                TeamMemberId = member.Id,
                DayOfWeek = day,
                StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(18, 0)
            });
        }
    }

    [HttpDelete("{id:guid}/members/{userId:guid}")]
    public async Task<IActionResult> RemoveMember(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken)
    {
        await using var transaction = await _context.Database
            .BeginTransactionAsync(cancellationToken);

        var member = await _context.TeamMembers.FirstOrDefaultAsync(
            teamMember =>
                teamMember.TeamId == id &&
                teamMember.UserId == userId,
            cancellationToken);
        if (member == null)
            return NotFound("Team member not found.");

        var team = await _context.Teams.FirstOrDefaultAsync(
            item => item.Id == id,
            cancellationToken);
        var wasTeamLeader =
            member.RoleInTeam == TeamMemberRole.TeamLeader ||
            team?.LeadId == userId;

        if (team?.LeadId == userId)
        {
            team.LeadId = null;
        }

        _context.TeamMembers.Remove(member);

        if (wasTeamLeader)
        {
            var leadsAnotherTeam = await _context.TeamMembers.AnyAsync(
                otherMembership =>
                    otherMembership.TeamId != id &&
                    otherMembership.UserId == userId &&
                    otherMembership.IsActive &&
                    otherMembership.Team.IsActive &&
                    otherMembership.RoleInTeam == TeamMemberRole.TeamLeader,
                cancellationToken);

            if (!leadsAnotherTeam)
            {
                leadsAnotherTeam = await _context.Teams.AnyAsync(
                    otherTeam =>
                        otherTeam.Id != id &&
                        otherTeam.LeadId == userId &&
                        otherTeam.IsActive,
                    cancellationToken);
            }

            if (!leadsAnotherTeam)
            {
                await SetSystemRoleAsync(
                    userId,
                    Roles.SupportAgent,
                    cancellationToken);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        if (wasTeamLeader)
        {
            await _hubContext.Clients
                .User(userId.ToString())
                .SendAsync(
                    "SessionChanged",
                    new { reason = "TeamLeadershipChanged" },
                    cancellationToken);
        }

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTeam(
        Guid id,
        CancellationToken cancellationToken)
    {
        await using var transaction = await _context.Database
            .BeginTransactionAsync(cancellationToken);

        var team = await _context.Teams
            .Include(item => item.TeamMembers)
            .FirstOrDefaultAsync(
                item => item.Id == id,
                cancellationToken);

        if (team == null)
            return NotFound("Team not found.");

        var leaderIds = team.TeamMembers
            .Where(member =>
                member.IsActive &&
                member.RoleInTeam == TeamMemberRole.TeamLeader)
            .Select(member => member.UserId)
            .ToHashSet();

        if (team.LeadId.HasValue)
            leaderIds.Add(team.LeadId.Value);

        var activeLeaderIds = await _context.Users
            .Where(user =>
                user.IsActive &&
                leaderIds.Contains(user.Id))
            .Select(user => user.Id)
            .ToListAsync(cancellationToken);

        var demotedLeaderIds = new List<Guid>();

        foreach (var leaderId in activeLeaderIds)
        {
            var leadsAnotherTeam = await _context.Teams
                .AnyAsync(otherTeam =>
                    otherTeam.Id != id &&
                    otherTeam.IsActive &&
                    (otherTeam.LeadId == leaderId ||
                     otherTeam.TeamMembers.Any(member =>
                         member.UserId == leaderId &&
                         member.IsActive &&
                         member.RoleInTeam == TeamMemberRole.TeamLeader)),
                    cancellationToken);

            if (leadsAnotherTeam)
                continue;

            await SetSystemRoleAsync(
                leaderId,
                Roles.SupportAgent,
                cancellationToken);
            demotedLeaderIds.Add(leaderId);
        }

        var usersLinkedToDeletedTeam = await _context.Users
            .Where(user => user.TeamId == id)
            .ToListAsync(cancellationToken);

        foreach (var user in usersLinkedToDeletedTeam)
            user.TeamId = null;

        _context.Teams.Remove(team);
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        foreach (var leaderId in demotedLeaderIds)
        {
            await _hubContext.Clients
                .User(leaderId.ToString())
                .SendAsync(
                    "SessionChanged",
                    new { reason = "TeamDeleted" },
                    cancellationToken);
        }

        return NoContent();
    }
}

public class CreateTeamDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? DepartmentId { get; set; }
}

public class UpdateTeamDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? DepartmentId { get; set; }
}

public class SetLeadDto
{
    public string? LeadId { get; set; }
}

public class AddMemberDto
{
    public string UserId { get; set; } = string.Empty;
}
