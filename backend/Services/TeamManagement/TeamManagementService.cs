using backend.Data;
using backend.Constants;
using backend.DTO.Common;
using backend.DTO.TeamManagement;
using backend.Entities;
using Microsoft.EntityFrameworkCore;
using TicketEntity = backend.Entities.Ticket;

namespace backend.Services.TeamManagement;

public sealed class TeamManagementService : ITeamManagementService
{
    private readonly AppDbContext _db;

    public TeamManagementService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<TeamManagementOverviewDto> GetOverviewAsync(
        Guid leaderUserId,
        Guid? teamId,
        CancellationToken cancellationToken = default)
    {
        var managedTeams = await GetManagedTeamsAsync(
            leaderUserId,
            cancellationToken);

        if (managedTeams.Count == 0)
        {
            throw new UnauthorizedAccessException(
                "You are not an active leader of any team.");
        }

        var selectedTeamId = teamId ?? managedTeams[0].Id;
        if (managedTeams.All(team => team.Id != selectedTeamId))
        {
            throw new UnauthorizedAccessException(
                "You can view only teams that you actively lead.");
        }

        var team = await _db.Teams
            .AsNoTracking()
            .Where(item => item.Id == selectedTeamId && item.IsActive)
            .Select(item => new
            {
                item.Id,
                item.Name,
                item.Description
            })
            .SingleAsync(cancellationToken);

        var teamTicketQuery = _db.Tickets
            .AsNoTracking()
            .Where(ticket =>
                ticket.TeamId == selectedTeamId &&
                !ticket.IsDeleted);

        var stats = await GetStatsAsync(
            teamTicketQuery,
            cancellationToken);

        var memberRows = await _db.TeamMembers
            .AsNoTracking()
            .Where(member =>
                member.TeamId == selectedTeamId &&
                member.IsActive &&
                member.User.IsActive &&
                member.User.UserRoles.Any(userRole =>
                    userRole.Role.IsActive &&
                    (userRole.Role.Name == Roles.SupportAgent ||
                     userRole.Role.Name == Roles.TeamLeader)))
            .OrderByDescending(member =>
                member.RoleInTeam == TeamMemberRole.TeamLeader)
            .ThenBy(member => member.User.Name)
            .ThenBy(member => member.User.LastName)
            .Select(member => new
            {
                TeamMemberId = member.Id,
                member.UserId,
                member.User.Name,
                member.User.LastName,
                member.RoleInTeam,
                member.JoinedAt
            })
            .ToListAsync(cancellationToken);

        var members = new List<TeamMemberSummaryDto>(memberRows.Count);
        foreach (var member in memberRows)
        {
            var recentTickets = await GetRecentAssignedTicketsAsync(
                selectedTeamId,
                member.TeamMemberId,
                member.UserId,
                cancellationToken);

            members.Add(new TeamMemberSummaryDto
            {
                TeamMemberId = member.TeamMemberId,
                UserId = member.UserId,
                FullName = $"{member.Name} {member.LastName}".Trim(),
                Title = FormatTeamRole(member.RoleInTeam),
                RoleInTeam = member.RoleInTeam.ToString(),
                JoinedAt = member.JoinedAt,
                RecentTickets = recentTickets
            });
        }

        return new TeamManagementOverviewDto
        {
            TeamId = team.Id,
            TeamName = team.Name,
            TeamDescription = team.Description,
            ManagedTeams = managedTeams,
            Stats = stats,
            Members = members
        };
    }

    public async Task<TeamMemberDetailDto?> GetMemberDetailAsync(
        Guid leaderUserId,
        Guid teamMemberId,
        int activePageNumber,
        int inactivePageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var member = await _db.TeamMembers
            .AsNoTracking()
            .Where(item =>
                item.Id == teamMemberId &&
                item.IsActive &&
                item.Team.IsActive &&
                item.User.IsActive &&
                item.User.UserRoles.Any(userRole =>
                    userRole.Role.IsActive &&
                    (userRole.Role.Name == Roles.SupportAgent ||
                     userRole.Role.Name == Roles.TeamLeader)))
            .Select(item => new
            {
                TeamMemberId = item.Id,
                item.TeamId,
                TeamName = item.Team.Name,
                item.UserId,
                item.User.Name,
                item.User.LastName,
                SystemRole = item.User.UserRoles
                    .Select(userRole => userRole.Role.Name)
                    .FirstOrDefault() ?? "User",
                item.User.CreatedAt,
                item.RoleInTeam,
                item.JoinedAt
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (member is null)
            return null;

        var leadsTeam = await _db.TeamMembers
            .AsNoTracking()
            .AnyAsync(item =>
                item.TeamId == member.TeamId &&
                item.UserId == leaderUserId &&
                item.RoleInTeam == TeamMemberRole.TeamLeader &&
                item.IsActive &&
                item.Team.IsActive &&
                item.User.IsActive,
                cancellationToken);

        if (!leadsTeam)
        {
            throw new UnauthorizedAccessException(
                "You can view members only from teams that you actively lead.");
        }

        var memberTicketQuery = _db.Tickets
            .AsNoTracking()
            .Where(ticket =>
                ticket.TeamId == member.TeamId &&
                !ticket.IsDeleted &&
                (ticket.CreatedById == member.UserId ||
                 ticket.AssignedToId == member.UserId));

        var stats = await GetStatsAsync(
            memberTicketQuery,
            cancellationToken);

        var activeTicketQuery = memberTicketQuery.Where(ticket =>
            !ticket.Status.IsClosed &&
            ticket.Status.Name != "Resolved" &&
            ticket.Status.Name != "Cancelled" &&
            ticket.Status.Name != "Closed");

        var inactiveTicketQuery = memberTicketQuery.Where(ticket =>
            ticket.Status.IsClosed ||
            ticket.Status.Name == "Resolved" ||
            ticket.Status.Name == "Cancelled" ||
            ticket.Status.Name == "Closed");

        var activeTickets = await GetMemberTicketsPageAsync(
            activeTicketQuery,
            [teamMemberId],
            member.UserId,
            activePageNumber,
            pageSize,
            cancellationToken);

        var inactiveTickets = await GetMemberTicketsPageAsync(
            inactiveTicketQuery,
            [teamMemberId],
            member.UserId,
            inactivePageNumber,
            pageSize,
            cancellationToken);

        return new TeamMemberDetailDto
        {
            TeamId = member.TeamId,
            TeamName = member.TeamName,
            TeamMemberId = member.TeamMemberId,
            UserId = member.UserId,
            FirstName = member.Name,
            LastName = member.LastName,
            FullName = $"{member.Name} {member.LastName}".Trim(),
            Title = FormatTeamRole(member.RoleInTeam),
            RoleInTeam = member.RoleInTeam.ToString(),
            SystemRole = member.SystemRole,
            RegisteredAt = member.CreatedAt,
            JoinedAt = member.JoinedAt,
            Stats = stats,
            ActiveTickets = activeTickets,
            InactiveTickets = inactiveTickets
        };
    }

    public async Task<TeamMemberDetailDto?> GetOwnMemberDetailAsync(
        Guid userId,
        int activePageNumber,
        int inactivePageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var memberships = await _db.TeamMembers
            .AsNoTracking()
            .Where(member =>
                member.UserId == userId &&
                member.IsActive &&
                member.Team.IsActive &&
                member.User.IsActive &&
                member.User.UserRoles.Any(userRole =>
                    userRole.Role.IsActive &&
                    (userRole.Role.Name == Roles.SupportAgent ||
                     userRole.Role.Name == Roles.TeamLeader)))
            .OrderBy(member => member.JoinedAt)
            .Select(member => new
            {
                TeamMemberId = member.Id,
                member.TeamId,
                TeamName = member.Team.Name,
                member.UserId,
                member.User.Name,
                member.User.LastName,
                SystemRole = member.User.UserRoles
                    .Select(userRole => userRole.Role.Name)
                    .FirstOrDefault() ?? "User",
                member.User.CreatedAt,
                member.RoleInTeam,
                member.JoinedAt
            })
            .ToListAsync(cancellationToken);

        if (memberships.Count == 0)
            return null;

        var primaryMembership = memberships[0];
        var teamMemberIds = memberships
            .Select(member => member.TeamMemberId)
            .ToArray();

        var assignedTicketQuery = _db.Tickets
            .AsNoTracking()
            .Where(ticket =>
                ticket.AssignedToId == userId &&
                !ticket.IsDeleted);

        var stats = await GetStatsAsync(
            assignedTicketQuery,
            cancellationToken);

        var activeTicketQuery = assignedTicketQuery.Where(ticket =>
            !ticket.Status.IsClosed &&
            ticket.Status.Name != "Resolved" &&
            ticket.Status.Name != "Cancelled" &&
            ticket.Status.Name != "Closed");

        var inactiveTicketQuery = assignedTicketQuery.Where(ticket =>
            ticket.Status.IsClosed ||
            ticket.Status.Name == "Resolved" ||
            ticket.Status.Name == "Cancelled" ||
            ticket.Status.Name == "Closed");

        var activeTickets = await GetMemberTicketsPageAsync(
            activeTicketQuery,
            teamMemberIds,
            userId,
            activePageNumber,
            pageSize,
            cancellationToken);

        var inactiveTickets = await GetMemberTicketsPageAsync(
            inactiveTicketQuery,
            teamMemberIds,
            userId,
            inactivePageNumber,
            pageSize,
            cancellationToken);

        return new TeamMemberDetailDto
        {
            TeamId = primaryMembership.TeamId,
            TeamName = string.Join(
                ", ",
                memberships
                    .Select(member => member.TeamName)
                    .Distinct()),
            TeamMemberId = primaryMembership.TeamMemberId,
            UserId = primaryMembership.UserId,
            FirstName = primaryMembership.Name,
            LastName = primaryMembership.LastName,
            FullName =
                $"{primaryMembership.Name} {primaryMembership.LastName}".Trim(),
            Title = memberships.Count == 1
                ? FormatTeamRole(primaryMembership.RoleInTeam)
                : "Team Member",
            RoleInTeam = memberships.Count == 1
                ? primaryMembership.RoleInTeam.ToString()
                : "Member",
            SystemRole = primaryMembership.SystemRole,
            RegisteredAt = primaryMembership.CreatedAt,
            JoinedAt = memberships.Min(member => member.JoinedAt),
            Stats = stats,
            ActiveTickets = activeTickets,
            InactiveTickets = inactiveTickets
        };
    }

    private async Task<PagedResultDto<TeamMemberTicketDto>>
        GetMemberTicketsPageAsync(
            IQueryable<TicketEntity> query,
            IReadOnlyCollection<Guid> teamMemberIds,
            Guid memberUserId,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken)
    {
        var normalizedPageNumber = Math.Max(pageNumber, 1);
        var normalizedPageSize = Math.Clamp(pageSize, 1, 100);
        var totalCount = await query.CountAsync(cancellationToken);
        var totalPages = totalCount == 0
            ? 0
            : (int)Math.Ceiling(totalCount / (double)normalizedPageSize);

        if (totalPages > 0 && normalizedPageNumber > totalPages)
            normalizedPageNumber = totalPages;

        var tickets = await query
            .Select(ticket => new
            {
                Ticket = ticket,
                AssignedAt = _db.TicketAssignments
                    .Where(assignment =>
                        assignment.TicketId == ticket.Id &&
                        teamMemberIds.Contains(assignment.AssignedToId))
                    .Max(assignment => (DateTime?)assignment.AssignedAt)
            })
            .OrderByDescending(item =>
                item.AssignedAt ?? item.Ticket.CreatedAt)
            .ThenByDescending(item => item.Ticket.TicketNumber)
            .Skip((normalizedPageNumber - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .Select(item => new TeamMemberTicketDto
            {
                Id = item.Ticket.Id,
                TicketNumber = item.Ticket.TicketNumber,
                TicketTitle = item.Ticket.TicketTitle,
                PriorityName = item.Ticket.Priority.Name,
                UrgencyLevelName = item.Ticket.UrgencyLevel.Name,
                StatusName = item.Ticket.Status.Name,
                CreatedByName =
                    item.Ticket.CreatedBy.Name + " " +
                    item.Ticket.CreatedBy.LastName,
                AssignedToName = item.Ticket.AssignedTo != null
                    ? item.Ticket.AssignedTo.Name + " " +
                      item.Ticket.AssignedTo.LastName
                    : null,
                CreatedAt = item.Ticket.CreatedAt,
                AssignedAt = item.AssignedAt,
                IsCreatedByMember =
                    item.Ticket.CreatedById == memberUserId,
                IsAssignedToMember =
                    item.Ticket.AssignedToId == memberUserId
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<TeamMemberTicketDto>(
            tickets,
            normalizedPageNumber,
            normalizedPageSize,
            totalCount,
            totalPages);
    }

    private async Task<List<ManagedTeamDto>> GetManagedTeamsAsync(
        Guid leaderUserId,
        CancellationToken cancellationToken)
    {
        return await _db.TeamMembers
            .AsNoTracking()
            .Where(member =>
                member.UserId == leaderUserId &&
                member.RoleInTeam == TeamMemberRole.TeamLeader &&
                member.IsActive &&
                member.Team.IsActive &&
                member.User.IsActive &&
                member.User.UserRoles.Any(userRole =>
                    userRole.Role.IsActive &&
                    userRole.Role.Name == Roles.TeamLeader))
            .OrderBy(member => member.Team.Name)
            .Select(member => new ManagedTeamDto
            {
                Id = member.TeamId,
                Name = member.Team.Name
            })
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    private async Task<List<TeamMemberTicketDto>>
        GetRecentAssignedTicketsAsync(
            Guid teamId,
            Guid teamMemberId,
            Guid userId,
            CancellationToken cancellationToken)
    {
        return await _db.Tickets
            .AsNoTracking()
            .Where(ticket =>
                ticket.TeamId == teamId &&
                ticket.AssignedToId == userId &&
                !ticket.IsDeleted &&
                !ticket.Status.IsClosed &&
                ticket.Status.Name != "Resolved" &&
                ticket.Status.Name != "Cancelled" &&
                ticket.Status.Name != "Closed")
            .Select(ticket => new
            {
                Ticket = ticket,
                AssignedAt = _db.TicketAssignments
                    .Where(assignment =>
                        assignment.TicketId == ticket.Id &&
                        assignment.AssignedToId == teamMemberId)
                    .Max(assignment => (DateTime?)assignment.AssignedAt)
            })
            .OrderByDescending(item => item.AssignedAt)
            .ThenByDescending(item => item.Ticket.CreatedAt)
            .Take(5)
            .Select(item => new TeamMemberTicketDto
            {
                Id = item.Ticket.Id,
                TicketNumber = item.Ticket.TicketNumber,
                TicketTitle = item.Ticket.TicketTitle,
                PriorityName = item.Ticket.Priority.Name,
                UrgencyLevelName = item.Ticket.UrgencyLevel.Name,
                StatusName = item.Ticket.Status.Name,
                CreatedByName =
                    item.Ticket.CreatedBy.Name + " " +
                    item.Ticket.CreatedBy.LastName,
                AssignedToName = item.Ticket.AssignedTo != null
                    ? item.Ticket.AssignedTo.Name + " " +
                      item.Ticket.AssignedTo.LastName
                    : null,
                CreatedAt = item.Ticket.CreatedAt,
                AssignedAt = item.AssignedAt,
                IsCreatedByMember = item.Ticket.CreatedById == userId,
                IsAssignedToMember = true
            })
            .ToListAsync(cancellationToken);
    }

    private static async Task<TeamTicketStatsDto> GetStatsAsync(
        IQueryable<TicketEntity> query,
        CancellationToken cancellationToken)
    {
        var statusCounts = await query
            .GroupBy(ticket => ticket.Status.Name)
            .Select(group => new
            {
                StatusName = group.Key,
                Count = group.Count()
            })
            .ToListAsync(cancellationToken);

        int CountStatuses(params string[] names)
        {
            return statusCounts
                .Where(status => names.Contains(
                    status.StatusName,
                    StringComparer.OrdinalIgnoreCase))
                .Sum(status => status.Count);
        }

        return new TeamTicketStatsDto
        {
            TotalCount = statusCounts.Sum(status => status.Count),
            OpenCount = CountStatuses("Open", "New"),
            InProgressCount = CountStatuses(
                "In Progress",
                "On Hold",
                "Waiting for User"),
            CompletedCount = CountStatuses(
                "Resolved",
                "Closed",
                "Cancelled")
        };
    }

    private static string FormatTeamRole(TeamMemberRole role)
    {
        return role switch
        {
            TeamMemberRole.TeamLeader => "Team Leader",
            TeamMemberRole.ITLeader => "IT Leader",
            TeamMemberRole.Supervisor => "Supervisor",
            _ => "Team Member"
        };
    }
}
