using backend.DTO.Common;

namespace backend.DTO.TeamManagement;

public sealed class ManagedTeamDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public sealed class TeamTicketStatsDto
{
    public int TotalCount { get; set; }
    public int OpenCount { get; set; }
    public int InProgressCount { get; set; }
    public int CompletedCount { get; set; }
}

public sealed class TeamMemberTicketDto
{
    public Guid Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string TicketTitle { get; set; } = string.Empty;
    public string PriorityName { get; set; } = string.Empty;
    public string UrgencyLevelName { get; set; } = string.Empty;
    public string StatusName { get; set; } = string.Empty;
    public string CreatedByName { get; set; } = string.Empty;
    public string? AssignedToName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? AssignedAt { get; set; }
    public bool IsCreatedByMember { get; set; }
    public bool IsAssignedToMember { get; set; }
}

public sealed class TeamMemberSummaryDto
{
    public Guid TeamMemberId { get; set; }
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string RoleInTeam { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
    public IReadOnlyCollection<TeamMemberTicketDto> RecentTickets { get; set; } = [];
}

public sealed class TeamManagementOverviewDto
{
    public Guid TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public string TeamDescription { get; set; } = string.Empty;
    public IReadOnlyCollection<ManagedTeamDto> ManagedTeams { get; set; } = [];
    public TeamTicketStatsDto Stats { get; set; } = new();
    public IReadOnlyCollection<TeamMemberSummaryDto> Members { get; set; } = [];
}

public sealed class TeamMemberDetailDto
{
    public Guid TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public Guid TeamMemberId { get; set; }
    public Guid UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string RoleInTeam { get; set; } = string.Empty;
    public string SystemRole { get; set; } = string.Empty;
    public DateTime RegisteredAt { get; set; }
    public DateTime JoinedAt { get; set; }
    public TeamTicketStatsDto Stats { get; set; } = new();
    public PagedResultDto<TeamMemberTicketDto> ActiveTickets { get; set; } = new();
    public PagedResultDto<TeamMemberTicketDto> InactiveTickets { get; set; } = new();
}
