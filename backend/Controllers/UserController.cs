using System.Security.Claims;
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
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;

    public UsersController(
        AppDbContext context,
        IHubContext<NotificationHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
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
    public async Task<IActionResult> UpdateUserRole(
        string id,
        [FromBody] UpdateRoleDto dto,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(id, out var userGuid))
        {
            return BadRequest("Invalid User ID format.");
        }

        var normalizedRole = dto.NewRole?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedRole))
            return BadRequest("Role name is required.");

        var user = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(
                u => u.Id == userGuid,
                cancellationToken);

        if (user == null)
            return NotFound("User not found.");

        var roleEntity = await _context.Roles
            .FirstOrDefaultAsync(
                role =>
                    role.IsActive &&
                    role.Name.ToLower() == normalizedRole.ToLower(),
                cancellationToken);

        if (roleEntity == null)
            return BadRequest("Invalid role name.");

        if (roleEntity.Name == Roles.TeamLeader)
        {
            return BadRequest(
                "The TeamLeader role can only be assigned from Team Management. " +
                "Add the user to the intended team as a SupportAgent first, then " +
                "select that user as the team's leader.");
        }

        var canRemainTeamMember = roleEntity.Name == Roles.SupportAgent;

        await using var transaction = await _context.Database
            .BeginTransactionAsync(cancellationToken);

        user.RoleId = roleEntity.Id;

        if (!canRemainTeamMember)
        {
            var memberships = await _context.TeamMembers
                .Where(member =>
                    member.UserId == userGuid &&
                    member.IsActive)
                .ToListAsync(cancellationToken);

            foreach (var membership in memberships)
                membership.IsActive = false;

            var ledTeams = await _context.Teams
                .Where(team => team.LeadId == userGuid)
                .ToListAsync(cancellationToken);

            foreach (var team in ledTeams)
                team.LeadId = null;

            user.TeamId = null;

            var activeAssignedTickets = await _context.Tickets
                .Where(ticket =>
                    ticket.AssignedToId == userGuid &&
                    !ticket.IsDeleted &&
                    !ticket.Status.IsClosed &&
                    ticket.Status.Name != "Resolved" &&
                    ticket.Status.Name != "Cancelled" &&
                    ticket.Status.Name != "Closed")
                .ToListAsync(cancellationToken);

            var changedById = Guid.TryParse(
                User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                User.FindFirstValue("sub"),
                out var adminUserId)
                    ? adminUserId
                    : Guid.Empty;

            foreach (var ticket in activeAssignedTickets)
            {
                ticket.AssignedToId = null;

                if (changedById != Guid.Empty)
                {
                    _context.TicketHistories.Add(new TicketHistory
                    {
                        TicketId = ticket.Id,
                        ActionType = TicketHistoryActionType.Unassigned,
                        FieldName = "Assignment",
                        OldValue = $"{user.Name} {user.LastName}".Trim(),
                        NewValue = ticket.TeamId.HasValue
                            ? "Assigned to team only"
                            : "Unassigned",
                        ChangedById = changedById,
                        ChangedAt = DateTime.UtcNow,
                        Description =
                            "Assignee removed because the user's new role " +
                            "does not permit team membership."
                    });
                }
            }
        }
        else if (roleEntity.Name == Roles.SupportAgent)
        {
            var leaderMemberships = await _context.TeamMembers
                .Where(member =>
                    member.UserId == userGuid &&
                    member.IsActive &&
                    member.RoleInTeam == TeamMemberRole.TeamLeader)
                .ToListAsync(cancellationToken);

            foreach (var membership in leaderMemberships)
                membership.RoleInTeam = TeamMemberRole.Member;

            var ledTeams = await _context.Teams
                .Where(team => team.LeadId == userGuid)
                .ToListAsync(cancellationToken);

            foreach (var team in ledTeams)
                team.LeadId = null;
        }

        var existingUserRoles = await _context.UserRoles
            .Where(userRole => userRole.UserId == userGuid)
            .ToListAsync(cancellationToken);

        _context.UserRoles.RemoveRange(existingUserRoles);

        _context.UserRoles.Add(new UserRole
        {
            UserId = userGuid,
            RoleId = roleEntity.Id,
            AssignedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        await _hubContext.Clients
            .User(userGuid.ToString())
            .SendAsync(
                "SessionChanged",
                new { reason = "RoleChanged" },
                cancellationToken);

        return NoContent();
    }

    public class UpdateRoleDto
    {
        public string NewRole { get; set; } = string.Empty;
    }
}
