using backend.DTO.Profile;

namespace backend.Services.Profile;

public enum ChangePasswordResult
{
    Success,
    UserNotFound,
    CurrentPasswordIncorrect,
    NewPasswordMatchesCurrent
}

public interface IProfileService
{
    Task<ProfileDto?> GetProfileAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<ProfileDto?> UpdateProfileAsync(
        Guid userId,
        UpdateProfileDto dto,
        CancellationToken cancellationToken = default);

    Task<ProfileDto?> UploadAvatarAsync(
        Guid userId,
        IFormFile file,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteAvatarAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<ChangePasswordResult> ChangePasswordAsync(
        Guid userId,
        ChangePasswordDto dto,
        CancellationToken cancellationToken = default);
}
