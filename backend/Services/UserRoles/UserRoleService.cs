using backend.Constants;
using backend.Data;
using backend.Entities;
using backend.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TicketHistoryEntity = backend.Entities.TicketHistory;

namespace backend.Services.UserRoles;

public sealed class UserRoleService : IUserRoleService
{
    private readonly AppDbContext _db;
    private readonly IHubContext<NotificationHub> _hubContext;

    public UserRoleService(
        AppDbContext db,
        IHubContext<NotificationHub> hubContext)
    {
        _db = db;
        _hubContext = hubContext;
    }

    public async Task SynchronizeRoleMappingsAsync(
        CancellationToken cancellationToken = default)
    {
        var users = await _db.Users
            .Include(user => user.UserRoles)
            .Where(user => user.RoleId.HasValue)
            .ToListAsync(cancellationToken);

        foreach (var user in users)
        {
            var targetRoleId = user.RoleId!.Value;
            var targetUserRole = user.UserRoles
                .FirstOrDefault(userRole =>
                    userRole.RoleId == targetRoleId);

            var obsoleteUserRoles = user.UserRoles
                .Where(userRole =>
                    userRole.RoleId != targetRoleId)
                .ToList();

            _db.UserRoles.RemoveRange(obsoleteUserRoles);

            if (targetUserRole is null)
            {
                _db.UserRoles.Add(new UserRole
                {
                    UserId = user.Id,
                    RoleId = targetRoleId,
                    AssignedAt = DateTime.UtcNow
                });
            }
        }

        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<UserRoleUpdateResult> UpdateUserRoleAsync(
        Guid userId,
        string? newRole,
        Guid changedById,
        CancellationToken cancellationToken = default)
    {
        var normalizedRole = newRole?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedRole))
        {
            return new UserRoleUpdateResult(
                UserRoleUpdateStatus.InvalidRole,
                "Role name is required.");
        }

        var user = await _db.Users
            .Include(item => item.Role)
            .Include(item => item.UserRoles)
            .FirstOrDefaultAsync(
                item => item.Id == userId && item.IsActive,
                cancellationToken);

        if (user is null)
        {
            return new UserRoleUpdateResult(
                UserRoleUpdateStatus.UserNotFound,
                "User not found.");
        }

        var targetRole = await _db.Roles
            .FirstOrDefaultAsync(
                role =>
                    role.IsActive &&
                    role.Name.ToLower() == normalizedRole.ToLower(),
                cancellationToken);

        if (targetRole is null)
        {
            return new UserRoleUpdateResult(
                UserRoleUpdateStatus.InvalidRole,
                "Invalid role name.");
        }

        var alreadyHasRequestedRole =
            user.RoleId == targetRole.Id &&
            user.UserRoles.Count == 1 &&
            user.UserRoles.Any(userRole =>
                userRole.RoleId == targetRole.Id);

        if (alreadyHasRequestedRole)
            return UserRoleUpdateResult.Succeeded();

        if (targetRole.Name == Roles.TeamLeader)
        {
            return new UserRoleUpdateResult(
                UserRoleUpdateStatus.TeamLeaderAssignmentForbidden,
                "The TeamLeader role can only be assigned from Team Management. " +
                "Add the user to the intended team as a SupportAgent first, then " +
                "select that user as the team's leader.");
        }

        await using var transaction = await _db.Database
            .BeginTransactionAsync(cancellationToken);

        user.RoleId = targetRole.Id;

        if (targetRole.Name == Roles.SupportAgent)
        {
            await DemoteFromTeamLeadershipAsync(
                userId,
                cancellationToken);
        }
        else
        {
            await RemoveTeamAccessAsync(
                user,
                changedById,
                cancellationToken);
        }

        var targetUserRole = user.UserRoles
            .FirstOrDefault(userRole =>
                userRole.RoleId == targetRole.Id);

        var obsoleteUserRoles = user.UserRoles
            .Where(userRole =>
                userRole.RoleId != targetRole.Id)
            .ToList();

        _db.UserRoles.RemoveRange(obsoleteUserRoles);

        if (targetUserRole is null)
        {
            _db.UserRoles.Add(new UserRole
            {
                UserId = userId,
                RoleId = targetRole.Id,
                AssignedAt = DateTime.UtcNow
            });
        }
        else
        {
            targetUserRole.AssignedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        await _hubContext.Clients
            .User(userId.ToString())
            .SendAsync(
                "SessionChanged",
                new { reason = "RoleChanged" },
                cancellationToken);

        return UserRoleUpdateResult.Succeeded();
    }

    private async Task DemoteFromTeamLeadershipAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var leaderMemberships = await _db.TeamMembers
            .Where(member =>
                member.UserId == userId &&
                member.IsActive &&
                member.RoleInTeam == TeamMemberRole.TeamLeader)
            .ToListAsync(cancellationToken);

        foreach (var membership in leaderMemberships)
            membership.RoleInTeam = TeamMemberRole.Member;

        var ledTeams = await _db.Teams
            .Where(team => team.LeadId == userId)
            .ToListAsync(cancellationToken);

        foreach (var team in ledTeams)
            team.LeadId = null;
    }

    private async Task RemoveTeamAccessAsync(
        User user,
        Guid changedById,
        CancellationToken cancellationToken)
    {
        var memberships = await _db.TeamMembers
            .Where(member =>
                member.UserId == user.Id &&
                member.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var membership in memberships)
            membership.IsActive = false;

        var ledTeams = await _db.Teams
            .Where(team => team.LeadId == user.Id)
            .ToListAsync(cancellationToken);

        foreach (var team in ledTeams)
            team.LeadId = null;

        user.TeamId = null;

        var activeAssignedTickets = await _db.Tickets
            .Where(ticket =>
                ticket.AssignedToId == user.Id &&
                !ticket.IsDeleted &&
                !ticket.Status.IsClosed &&
                ticket.Status.Name != "Resolved" &&
                ticket.Status.Name != "Cancelled" &&
                ticket.Status.Name != "Closed")
            .ToListAsync(cancellationToken);

        foreach (var ticket in activeAssignedTickets)
        {
            ticket.AssignedToId = null;

            if (changedById == Guid.Empty)
                continue;

            _db.TicketHistories.Add(new TicketHistoryEntity
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
