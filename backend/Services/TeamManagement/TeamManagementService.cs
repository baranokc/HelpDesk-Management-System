using backend.Data;
using backend.Constants;
using backend.DTO.Common;
using backend.DTO.TeamManagement;
using backend.Entities;
using Microsoft.EntityFrameworkCore;
using SatisfactionSurveyEntity = backend.Entities.SatisfactionSurvey;
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
        int unassignedPageNumber,
        int unassignedPageSize,
        string unassignedSortBy,
        string unassignedSortDirection,
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

        var unassignedTickets = await GetUnassignedTicketsPageAsync(
            teamTicketQuery.Where(ticket =>
                !ticket.AssignedToId.HasValue &&
                !ticket.Status.IsClosed &&
                ticket.Status.Name != "Resolved" &&
                ticket.Status.Name != "Cancelled" &&
                ticket.Status.Name != "Closed"),
            unassignedPageNumber,
            unassignedPageSize,
            unassignedSortBy,
            unassignedSortDirection,
            cancellationToken);

        var csat = await GetCsatStatsAsync(
            _db.SatisfactionSurveys
                .AsNoTracking()
                .Where(survey => survey.Ticket.TeamId == selectedTeamId),
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

        var memberCsatRows = await _db.SatisfactionSurveys
            .AsNoTracking()
            .Where(survey =>
                survey.Ticket.TeamId == selectedTeamId &&
                survey.Ticket.AssignedToId.HasValue)
            .GroupBy(survey => survey.Ticket.AssignedToId!.Value)
            .Select(group => new
            {
                UserId = group.Key,
                AverageRating = group.Average(survey => survey.Rating),
                AverageCommunicationRating = group.Average(
                    survey => survey.CommunicationRating),
                AverageSolutionRating = group.Average(
                    survey => survey.SolutionRating),
                AverageSpeedRating = group.Average(
                    survey => survey.SpeedRating),
                TotalSurveysCount = group.Count()
            })
            .ToListAsync(cancellationToken);

        var memberCsatByUserId = memberCsatRows.ToDictionary(
            row => row.UserId,
            row => new CsatStatsDto
            {
                AverageRating = Math.Round(row.AverageRating, 1),
                AverageCommunicationRating = Math.Round(
                    row.AverageCommunicationRating,
                    1),
                AverageSolutionRating = Math.Round(
                    row.AverageSolutionRating,
                    1),
                AverageSpeedRating = Math.Round(
                    row.AverageSpeedRating,
                    1),
                TotalSurveysCount = row.TotalSurveysCount
            });

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
                Csat = memberCsatByUserId.GetValueOrDefault(member.UserId)
                    ?? new CsatStatsDto(),
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
            Csat = csat,
            UnassignedTickets = unassignedTickets,
            Members = members
        };
    }

    public async Task<TeamMemberDetailDto?> GetMemberDetailAsync(
        Guid leaderUserId,
        Guid teamMemberId,
        int activePageNumber,
        int inactivePageNumber,
        int pageSize,
        string activeSortBy,
        string activeSortDirection,
        string inactiveSortBy,
        string inactiveSortDirection,
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
            activeSortBy,
            activeSortDirection,
            cancellationToken);

        var inactiveTickets = await GetMemberTicketsPageAsync(
            inactiveTicketQuery,
            [teamMemberId],
            member.UserId,
            inactivePageNumber,
            pageSize,
            inactiveSortBy,
            inactiveSortDirection,
            cancellationToken);

        var schedule = await GetMemberScheduleAsync(
            member.TeamMemberId,
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
            Schedule = schedule,
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
        string activeSortBy,
        string activeSortDirection,
        string inactiveSortBy,
        string inactiveSortDirection,
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
            activeSortBy,
            activeSortDirection,
            cancellationToken);

        var inactiveTickets = await GetMemberTicketsPageAsync(
            inactiveTicketQuery,
            teamMemberIds,
            userId,
            inactivePageNumber,
            pageSize,
            inactiveSortBy,
            inactiveSortDirection,
            cancellationToken);

        var schedule = await GetMemberScheduleAsync(
            primaryMembership.TeamMemberId,
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
            Schedule = schedule,
            Stats = stats,
            ActiveTickets = activeTickets,
            InactiveTickets = inactiveTickets
        };
    }

public async Task<TeamMemberScheduleDto?> UpdateMemberScheduleAsync(
    Guid leaderUserId,
    Guid teamMemberId,
    UpdateTeamMemberScheduleDto dto,
    CancellationToken cancellationToken = default)
{
    ArgumentNullException.ThrowIfNull(dto);
    ValidateShifts(dto.Shifts);

    // Önceki isteklerden kalmış olabilecek takip edilen entity'leri temizle.
    _db.ChangeTracker.Clear();

    var member = await GetManagedMemberForUpdateAsync(
        leaderUserId,
        teamMemberId,
        includeShifts: false,
        cancellationToken: cancellationToken);

    if (member is null)
        return null;

    await using var transaction =
        await _db.Database.BeginTransactionAsync(cancellationToken);

    // Silme işlemini ChangeTracker kullanmadan doğrudan veritabanında yapar.
    // Kayıt zaten yoksa concurrency exception oluşmaz.
    await _db.TeamMemberShifts
        .Where(shift => shift.TeamMemberId == member.Id)
        .ExecuteDeleteAsync(cancellationToken);

    var replacementShifts = dto.Shifts
        .OrderBy(shift => shift.DayOfWeek)
        .Select(shift => new TeamMemberShift
        {
            Id = Guid.NewGuid(),
            TeamMemberId = member.Id,
            DayOfWeek = shift.DayOfWeek,
            StartTime = shift.StartTime,
            EndTime = shift.EndTime
        })
        .ToList();

    if (replacementShifts.Count > 0)
    {
        await _db.TeamMemberShifts.AddRangeAsync(
            replacementShifts,
            cancellationToken);
    }

    await _db.SaveChangesAsync(cancellationToken);
    await transaction.CommitAsync(cancellationToken);

    return await GetMemberScheduleAsync(
        member.Id,
        cancellationToken);
}

    public async Task<TeamMemberLeaveDto?> AddMemberLeaveAsync(
        Guid leaderUserId,
        Guid teamMemberId,
        CreateTeamMemberLeaveDto dto,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(dto);
        var reason = ValidateLeave(dto);

        var member = await GetManagedMemberForUpdateAsync(
            leaderUserId,
            teamMemberId,
            includeShifts: false,
            cancellationToken: cancellationToken);

        if (member is null)
            return null;

        var overlaps = await _db.TeamMemberLeaves
            .AsNoTracking()
            .AnyAsync(leave =>
                leave.TeamMemberId == member.Id &&
                leave.StartDate <= dto.EndDate &&
                leave.EndDate >= dto.StartDate,
                cancellationToken);

        if (overlaps)
        {
            throw new InvalidOperationException(
                "The selected dates overlap an existing leave period.");
        }

        var leave = new TeamMemberLeave
        {
            Id = Guid.NewGuid(),
            TeamMemberId = member.Id,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Reason = reason,
            CreatedById = leaderUserId,
            CreatedAt = DateTime.UtcNow
        };

        _db.TeamMemberLeaves.Add(leave);
        await _db.SaveChangesAsync(cancellationToken);

        return await GetLeaveDtoAsync(leave.Id, cancellationToken);
    }

    public async Task<TeamMemberLeaveDto?> UpdateMemberLeaveAsync(
        Guid leaderUserId,
        Guid teamMemberId,
        Guid leaveId,
        CreateTeamMemberLeaveDto dto,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(dto);
        var reason = ValidateLeave(dto);

        var member = await GetManagedMemberForUpdateAsync(
            leaderUserId,
            teamMemberId,
            includeShifts: false,
            cancellationToken: cancellationToken);

        if (member is null)
            return null;

        var leave = await _db.TeamMemberLeaves.SingleOrDefaultAsync(
            item =>
                item.Id == leaveId &&
                item.TeamMemberId == member.Id,
            cancellationToken);

        if (leave is null)
            return null;

        var overlaps = await _db.TeamMemberLeaves
            .AsNoTracking()
            .AnyAsync(item =>
                item.TeamMemberId == member.Id &&
                item.Id != leave.Id &&
                item.StartDate <= dto.EndDate &&
                item.EndDate >= dto.StartDate,
                cancellationToken);

        if (overlaps)
        {
            throw new InvalidOperationException(
                "The selected dates overlap an existing leave period.");
        }

        leave.StartDate = dto.StartDate;
        leave.EndDate = dto.EndDate;
        leave.Reason = reason;

        await _db.SaveChangesAsync(cancellationToken);
        return await GetLeaveDtoAsync(leave.Id, cancellationToken);
    }

    public async Task<bool> DeleteMemberLeaveAsync(
        Guid leaderUserId,
        Guid teamMemberId,
        Guid leaveId,
        CancellationToken cancellationToken = default)
    {
        var member = await GetManagedMemberForUpdateAsync(
            leaderUserId,
            teamMemberId,
            includeShifts: false,
            cancellationToken: cancellationToken);

        if (member is null)
            return false;

        var leave = await _db.TeamMemberLeaves.SingleOrDefaultAsync(
            item =>
                item.Id == leaveId &&
                item.TeamMemberId == member.Id,
            cancellationToken);

        if (leave is null)
            return false;

        _db.TeamMemberLeaves.Remove(leave);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task<TeamMember?> GetManagedMemberForUpdateAsync(
        Guid leaderUserId,
        Guid teamMemberId,
        bool includeShifts,
        CancellationToken cancellationToken)
    {
        IQueryable<TeamMember> query = _db.TeamMembers;

        if (includeShifts)
            query = query.Include(member => member.Shifts);

        var member = await query.SingleOrDefaultAsync(item =>
            item.Id == teamMemberId &&
            item.IsActive &&
            item.Team.IsActive &&
            item.User.IsActive &&
            item.User.UserRoles.Any(userRole =>
                userRole.Role.IsActive &&
                (userRole.Role.Name == Roles.SupportAgent ||
                 userRole.Role.Name == Roles.TeamLeader)),
            cancellationToken);

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
                item.User.IsActive &&
                item.User.UserRoles.Any(userRole =>
                    userRole.Role.IsActive &&
                    userRole.Role.Name == Roles.TeamLeader),
                cancellationToken);

        if (!leadsTeam)
        {
            throw new UnauthorizedAccessException(
                "You can manage schedules only for members of teams that you actively lead.");
        }

        return member;
    }

    private async Task<TeamMemberScheduleDto> GetMemberScheduleAsync(
        Guid teamMemberId,
        CancellationToken cancellationToken)
    {
        var timeZoneId = await _db.TeamMembers
            .AsNoTracking()
            .Where(member => member.Id == teamMemberId)
            .Select(member => member.Team.SlaCalendar != null
                ? member.Team.SlaCalendar.TimeZoneId
                : "Europe/Istanbul")
            .SingleAsync(cancellationToken);

        var shifts = await _db.TeamMemberShifts
            .AsNoTracking()
            .Where(shift => shift.TeamMemberId == teamMemberId)
            .OrderBy(shift => shift.DayOfWeek)
            .Select(shift => new TeamMemberShiftDto
            {
                Id = shift.Id,
                DayOfWeek = shift.DayOfWeek,
                StartTime = shift.StartTime,
                EndTime = shift.EndTime
            })
            .ToListAsync(cancellationToken);

        var leaves = await _db.TeamMemberLeaves
            .AsNoTracking()
            .Where(leave => leave.TeamMemberId == teamMemberId)
            .OrderByDescending(leave => leave.StartDate)
            .Select(leave => new TeamMemberLeaveDto
            {
                Id = leave.Id,
                StartDate = leave.StartDate,
                EndDate = leave.EndDate,
                Reason = leave.Reason,
                CreatedById = leave.CreatedById,
                CreatedByName =
                    leave.CreatedBy.Name + " " +
                    leave.CreatedBy.LastName,
                CreatedAt = leave.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new TeamMemberScheduleDto
        {
            TimeZoneId = timeZoneId,
            Shifts = shifts,
            Leaves = leaves
        };
    }

    private static void ValidateShifts(
        IReadOnlyCollection<TeamMemberShiftUpsertDto> shifts)
    {
        if (shifts.Count > 7)
            throw new ArgumentException(
                "A weekly schedule can contain at most one shift per day.");

        var duplicateDay = shifts
            .GroupBy(shift => shift.DayOfWeek)
            .FirstOrDefault(group => group.Count() > 1);

        if (duplicateDay is not null)
            throw new ArgumentException(
                $"Only one shift can be defined for {duplicateDay.Key}.");

        foreach (var shift in shifts)
        {
            if (!Enum.IsDefined(typeof(DayOfWeek), shift.DayOfWeek))
                throw new ArgumentException("A shift contains an invalid day.");

            if (shift.StartTime >= shift.EndTime)
            {
                throw new ArgumentException(
                    $"Shift start time must be earlier than end time for {shift.DayOfWeek}.");
            }
        }
    }

    private static string ValidateLeave(CreateTeamMemberLeaveDto dto)
    {
        var reason = dto.Reason?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Leave reason is required.");

        if (reason.Length > 500)
            throw new ArgumentException(
                "Leave reason cannot exceed 500 characters.");

        if (dto.EndDate < dto.StartDate)
        {
            throw new ArgumentException(
                "Leave end date cannot be earlier than its start date.");
        }

        return reason;
    }

    private Task<TeamMemberLeaveDto> GetLeaveDtoAsync(
        Guid leaveId,
        CancellationToken cancellationToken)
    {
        return _db.TeamMemberLeaves
            .AsNoTracking()
            .Where(item => item.Id == leaveId)
            .Select(item => new TeamMemberLeaveDto
            {
                Id = item.Id,
                StartDate = item.StartDate,
                EndDate = item.EndDate,
                Reason = item.Reason,
                CreatedById = item.CreatedById,
                CreatedByName =
                    item.CreatedBy.Name + " " +
                    item.CreatedBy.LastName,
                CreatedAt = item.CreatedAt
            })
            .SingleAsync(cancellationToken);
    }

    private async Task<PagedResultDto<TeamMemberTicketDto>>
        GetMemberTicketsPageAsync(
            IQueryable<TicketEntity> query,
            IReadOnlyCollection<Guid> teamMemberIds,
            Guid memberUserId,
            int pageNumber,
            int pageSize,
            string sortBy,
            string sortDirection,
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

        var tickets = await ApplyTicketSorting(query, sortBy, sortDirection)
            .Select(ticket => new
            {
                Ticket = ticket,
                AssignedAt = _db.TicketAssignments
                    .Where(assignment =>
                        assignment.TicketId == ticket.Id &&
                        assignment.AssignedToId.HasValue &&
                        teamMemberIds.Contains(assignment.AssignedToId.Value))
                    .Max(assignment => (DateTime?)assignment.AssignedAt)
            })
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

    private static async Task<PagedResultDto<UnassignedTeamTicketDto>>
        GetUnassignedTicketsPageAsync(
            IQueryable<TicketEntity> query,
            int pageNumber,
            int pageSize,
            string sortBy,
            string sortDirection,
            CancellationToken cancellationToken)
    {
        var normalizedPageNumber = Math.Max(pageNumber, 1);
        var normalizedPageSize = Math.Clamp(pageSize, 1, 50);
        var totalCount = await query.CountAsync(cancellationToken);
        var totalPages = totalCount == 0
            ? 0
            : (int)Math.Ceiling(totalCount / (double)normalizedPageSize);

        if (totalPages > 0 && normalizedPageNumber > totalPages)
            normalizedPageNumber = totalPages;

        var tickets = await ApplyTicketSorting(query, sortBy, sortDirection)
            .Skip((normalizedPageNumber - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .Select(ticket => new UnassignedTeamTicketDto
            {
                Id = ticket.Id,
                TicketNumber = ticket.TicketNumber,
                TicketTitle = ticket.TicketTitle,
                CategoryName = ticket.Category.Name,
                StatusName = ticket.Status.Name,
                PriorityName = ticket.Priority.Name,
                CreatedByName =
                    ticket.CreatedBy.Name + " " + ticket.CreatedBy.LastName,
                CreatedByAvatarUrl = ticket.CreatedBy.AvatarFileName == null
                    ? null
                    : "/uploads/avatars/" + ticket.CreatedBy.AvatarFileName,
                CreatedAt = ticket.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<UnassignedTeamTicketDto>(
            tickets,
            normalizedPageNumber,
            normalizedPageSize,
            totalCount,
            totalPages);
    }

    private static IOrderedQueryable<TicketEntity> ApplyTicketSorting(
        IQueryable<TicketEntity> query,
        string sortBy,
        string sortDirection)
    {
        var descending = !string.Equals(
            sortDirection,
            "asc",
            StringComparison.OrdinalIgnoreCase);

        return (sortBy?.Trim().ToLowerInvariant() ?? "ticketnumber") switch
        {
            "title" => descending
                ? query.OrderByDescending(ticket => ticket.TicketTitle)
                    .ThenByDescending(ticket => ticket.TicketNumber)
                : query.OrderBy(ticket => ticket.TicketTitle)
                    .ThenBy(ticket => ticket.TicketNumber),

            "status" => descending
                ? query.OrderByDescending(ticket => ticket.Status.Name)
                    .ThenByDescending(ticket => ticket.TicketNumber)
                : query.OrderBy(ticket => ticket.Status.Name)
                    .ThenBy(ticket => ticket.TicketNumber),

            "priority" => descending
                ? query.OrderBy(ticket => ticket.Priority.ResponseTime)
                    .ThenByDescending(ticket => ticket.TicketNumber)
                : query.OrderByDescending(ticket => ticket.Priority.ResponseTime)
                    .ThenBy(ticket => ticket.TicketNumber),

            "createdby" => descending
                ? query.OrderByDescending(ticket => ticket.CreatedBy.Name)
                    .ThenByDescending(ticket => ticket.CreatedBy.LastName)
                    .ThenByDescending(ticket => ticket.TicketNumber)
                : query.OrderBy(ticket => ticket.CreatedBy.Name)
                    .ThenBy(ticket => ticket.CreatedBy.LastName)
                    .ThenBy(ticket => ticket.TicketNumber),

            _ => descending
                ? query.OrderByDescending(ticket => ticket.TicketNumber)
                    .ThenByDescending(ticket => ticket.CreatedAt)
                : query.OrderBy(ticket => ticket.TicketNumber)
                    .ThenBy(ticket => ticket.CreatedAt)
        };
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

    private static async Task<CsatStatsDto> GetCsatStatsAsync(
        IQueryable<SatisfactionSurveyEntity> query,
        CancellationToken cancellationToken)
    {
        var stats = await query
            .GroupBy(_ => 1)
            .Select(group => new
            {
                AverageRating = group.Average(survey => survey.Rating),
                AverageCommunicationRating = group.Average(
                    survey => survey.CommunicationRating),
                AverageSolutionRating = group.Average(
                    survey => survey.SolutionRating),
                AverageSpeedRating = group.Average(
                    survey => survey.SpeedRating),
                TotalSurveysCount = group.Count()
            })
            .SingleOrDefaultAsync(cancellationToken);

        return stats is null
            ? new CsatStatsDto()
            : new CsatStatsDto
            {
                AverageRating = Math.Round(stats.AverageRating, 1),
                AverageCommunicationRating = Math.Round(
                    stats.AverageCommunicationRating,
                    1),
                AverageSolutionRating = Math.Round(
                    stats.AverageSolutionRating,
                    1),
                AverageSpeedRating = Math.Round(
                    stats.AverageSpeedRating,
                    1),
                TotalSurveysCount = stats.TotalSurveysCount
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