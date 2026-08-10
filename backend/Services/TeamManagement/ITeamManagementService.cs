using backend.DTO.TeamManagement;

namespace backend.Services.TeamManagement;

public interface ITeamManagementService
{
    Task<TeamManagementOverviewDto> GetOverviewAsync(
        Guid leaderUserId,
        Guid? teamId,
        int unassignedPageNumber,
        int unassignedPageSize,
        CancellationToken cancellationToken = default);

    Task<TeamMemberDetailDto?> GetMemberDetailAsync(
        Guid leaderUserId,
        Guid teamMemberId,
        int activePageNumber,
        int inactivePageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<TeamMemberDetailDto?> GetOwnMemberDetailAsync(
        Guid userId,
        int activePageNumber,
        int inactivePageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<TeamMemberScheduleDto?> UpdateMemberScheduleAsync(
        Guid leaderUserId,
        Guid teamMemberId,
        UpdateTeamMemberScheduleDto dto,
        CancellationToken cancellationToken = default);

    Task<TeamMemberLeaveDto?> AddMemberLeaveAsync(
        Guid leaderUserId,
        Guid teamMemberId,
        CreateTeamMemberLeaveDto dto,
        CancellationToken cancellationToken = default);

    Task<TeamMemberLeaveDto?> UpdateMemberLeaveAsync(
        Guid leaderUserId,
        Guid teamMemberId,
        Guid leaveId,
        CreateTeamMemberLeaveDto dto,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteMemberLeaveAsync(
        Guid leaderUserId,
        Guid teamMemberId,
        Guid leaveId,
        CancellationToken cancellationToken = default);
}
