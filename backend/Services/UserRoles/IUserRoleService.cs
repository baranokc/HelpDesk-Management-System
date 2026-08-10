namespace backend.Services.UserRoles;

public enum UserRoleUpdateStatus
{
    Success,
    UserNotFound,
    InvalidRole,
    TeamLeaderAssignmentForbidden
}

public sealed record UserRoleUpdateResult(
    UserRoleUpdateStatus Status,
    string Message)
{
    public bool IsSuccess => Status == UserRoleUpdateStatus.Success;

    public static UserRoleUpdateResult Succeeded() =>
        new(UserRoleUpdateStatus.Success, string.Empty);
}

public interface IUserRoleService
{
    Task SynchronizeRoleMappingsAsync(
        CancellationToken cancellationToken = default);

    Task<UserRoleUpdateResult> UpdateUserRoleAsync(
        Guid userId,
        string? newRole,
        Guid changedById,
        CancellationToken cancellationToken = default);
}
