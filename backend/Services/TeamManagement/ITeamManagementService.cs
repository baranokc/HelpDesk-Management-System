using backend.DTO.TeamManagement;

namespace backend.Services.TeamManagement;

public interface ITeamManagementService
{
    Task<TeamManagementOverviewDto> GetOverviewAsync(
        Guid leaderUserId,
        Guid? teamId,
        CancellationToken cancellationToken = default);

    Task<TeamMemberDetailDto?> GetMemberDetailAsync(
        Guid leaderUserId,
        Guid teamMemberId,
        int activePageNumber,
        int inactivePageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);
}
