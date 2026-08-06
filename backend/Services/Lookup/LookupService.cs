using backend.Data;
using backend.Constants;
using backend.DTO.Lookup;
using backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Lookup;

public class LookupService : ILookupService
{
    private readonly AppDbContext _db;
    public LookupService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyCollection<LookupItemDto<Guid>>> GetCategoriesAsync(CancellationToken cancellationToken = default) =>
        await _db.TicketCategories.AsNoTracking()
            .Where(x =>
                x.IsActive &&
                x.DefaultTeamId.HasValue &&
                x.DefaultTeam != null &&
                x.DefaultTeam.IsActive)
            .OrderBy(x => x.Name)
            .Select(x => new LookupItemDto<Guid> { ItemId = x.Id, Name = x.Name }).ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<LookupItemDto<Guid>>> GetSubCategoriesAsync(Guid categoryId, CancellationToken cancellationToken = default) =>
        await _db.TicketSubCategories.AsNoTracking().Where(x => x.CategoryId == categoryId && x.IsActive).OrderBy(x => x.Name)
            .Select(x => new LookupItemDto<Guid> { ItemId = x.Id, Name = x.Name }).ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<LookupItemDto<Guid>>> GetPrioritiesAsync(CancellationToken cancellationToken = default) =>
        await _db.TicketPriorities.AsNoTracking().OrderBy(x => x.ResponseTime).ThenBy(x => x.Name)
            .Select(x => new LookupItemDto<Guid> { ItemId = x.Id, Name = x.Name }).ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<LookupItemDto<Guid>>> GetStatusesAsync(CancellationToken cancellationToken = default) =>
        await _db.TicketStatuses.AsNoTracking().Where(x => x.IsActive).OrderByDescending(x => x.IsInitial).ThenBy(x => x.Name)
            .Select(x => new LookupItemDto<Guid> { ItemId = x.Id, Name = x.Name }).ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<LookupItemDto<Guid>>> GetImpactLevelsAsync(CancellationToken cancellationToken = default) =>
        await _db.ImpactLevels.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.Order)
            .Select(x => new LookupItemDto<Guid> { ItemId = x.Id, Name = x.Name }).ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<LookupItemDto<Guid>>> GetUrgencyLevelsAsync(CancellationToken cancellationToken = default) =>
        await _db.UrgencyLevels.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.Order)
            .Select(x => new LookupItemDto<Guid> { ItemId = x.Id, Name = x.Name }).ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<LookupItemDto<Guid>>> GetTeamsAsync(
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var query = _db.Teams
            .AsNoTracking()
            .Where(team => team.IsActive);

        return await query
            .OrderBy(team => team.Name)
            .Select(team => new LookupItemDto<Guid>
            {
                ItemId = team.Id,
                Name = team.Name
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<TeamMemberLookupDto>> GetTeamMembersAsync(
        Guid teamId,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        if (currentUserRole == Roles.TeamLeader)
        {
            var leadsTeam = await _db.TeamMembers
                .AsNoTracking()
                .AnyAsync(teamMember =>
                    teamMember.TeamId == teamId &&
                    teamMember.UserId == currentUserId &&
                    teamMember.RoleInTeam == TeamMemberRole.TeamLeader &&
                    teamMember.IsActive &&
                    teamMember.Team.IsActive &&
                    teamMember.User.IsActive,
                    cancellationToken);

            if (!leadsTeam)
                return Array.Empty<TeamMemberLookupDto>();
        }

        return await _db.TeamMembers.AsNoTracking().Where(x =>
                x.TeamId == teamId &&
                x.IsActive &&
                x.User.IsActive &&
                x.User.UserRoles.Any(userRole =>
                    userRole.Role.IsActive &&
                    (userRole.Role.Name == Roles.SupportAgent ||
                     userRole.Role.Name == Roles.TeamLeader)))
            .OrderBy(x => x.User.Name).ThenBy(x => x.User.LastName)
            .Select(x => new TeamMemberLookupDto { TeamMemberId = x.Id, UserId = x.UserId, FullName = x.User.Name + " " + x.User.LastName, RoleInTeam = x.RoleInTeam.ToString() })
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<LookupItemDto<int>>> GetDepartmentsAsync(CancellationToken cancellationToken = default) =>
        await _db.Departments.AsNoTracking().Where(x => x.IsActive ).OrderBy(x => x.Name)
            .Select(x => new LookupItemDto<int> { ItemId = x.Id, Name = x.Name }).ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<LookupItemDto<Guid>>> GetRolesAsync(CancellationToken cancellationToken = default) =>
        await _db.Roles.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.Name)
            .Select(x => new LookupItemDto<Guid> { ItemId = x.Id, Name = x.Name }).ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<LookupItemDto<Guid>>> GetResolutionCategoriesAsync(CancellationToken cancellationToken = default) =>
        await _db.Set<ResolutionCategory>().AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.Name)
            .Select(x => new LookupItemDto<Guid> { ItemId = x.Id, Name = x.Name }).ToListAsync(cancellationToken);

    public IReadOnlyCollection<EnumLookupItemDto> GetRequestTypes() =>
        Enum.GetValues<RequestType>().Where(x => x != RequestType.Unknown)
            .Select(x => new EnumLookupItemDto { ItemId = (int)x, Name = x.ToString() }).ToList();
}
