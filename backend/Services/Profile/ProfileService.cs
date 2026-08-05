using backend.Constants;
using backend.Data;
using backend.DTO.Profile;
using backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Profile;

public class ProfileService : IProfileService
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _environment;

    public ProfileService(
        AppDbContext db,
        IWebHostEnvironment environment)
    {
        _db = db;
        _environment = environment;
    }

    public async Task<ProfileDto?> GetProfileAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await ProfileQuery()
            .AsNoTracking()
            .SingleOrDefaultAsync(
                item => item.Id == userId && item.IsActive,
                cancellationToken);

        return user is null ? null : ToDto(user);
    }

    public async Task<ProfileDto?> UpdateProfileAsync(
        Guid userId,
        UpdateProfileDto dto,
        CancellationToken cancellationToken = default)
    {
        var user = await ProfileQuery()
            .SingleOrDefaultAsync(
                item => item.Id == userId && item.IsActive,
                cancellationToken);

        if (user is null)
            return null;

        user.Name = dto.FirstName.Trim();
        user.LastName = dto.LastName.Trim();

        await _db.SaveChangesAsync(cancellationToken);
        return ToDto(user);
    }

    public async Task<ProfileDto?> UploadAvatarAsync(
        Guid userId,
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        var user = await ProfileQuery()
            .SingleOrDefaultAsync(
                item => item.Id == userId && item.IsActive,
                cancellationToken);

        if (user is null)
            return null;

        var extension = await GetVerifiedExtensionAsync(
            file,
            cancellationToken);

        var avatarDirectory = GetAvatarDirectory();
        Directory.CreateDirectory(avatarDirectory);

        var newFileName = $"{Guid.NewGuid():N}{extension}";
        var newPhysicalPath = Path.Combine(avatarDirectory, newFileName);
        var oldFileName = user.AvatarFileName;

        try
        {
            await using (var target = new FileStream(
                newPhysicalPath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                81920,
                FileOptions.Asynchronous))
            {
                await file.CopyToAsync(target, cancellationToken);
            }

            user.AvatarFileName = newFileName;
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            TryDeleteFile(newPhysicalPath);
            throw;
        }

        if (!string.IsNullOrWhiteSpace(oldFileName))
        {
            TryDeleteFile(Path.Combine(
                avatarDirectory,
                Path.GetFileName(oldFileName)));
        }

        return ToDto(user);
    }

    public async Task<bool> DeleteAvatarAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _db.Users.SingleOrDefaultAsync(
            item => item.Id == userId && item.IsActive,
            cancellationToken);

        if (user is null)
            return false;

        var oldFileName = user.AvatarFileName;
        user.AvatarFileName = null;
        await _db.SaveChangesAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(oldFileName))
        {
            TryDeleteFile(Path.Combine(
                GetAvatarDirectory(),
                Path.GetFileName(oldFileName)));
        }

        return true;
    }

    public async Task<ChangePasswordResult> ChangePasswordAsync(
        Guid userId,
        ChangePasswordDto dto,
        CancellationToken cancellationToken = default)
    {
        var user = await _db.Users.SingleOrDefaultAsync(
            item => item.Id == userId && item.IsActive,
            cancellationToken);

        if (user is null)
            return ChangePasswordResult.UserNotFound;

        if (!BCrypt.Net.BCrypt.Verify(
                dto.CurrentPassword,
                user.PasswordHash))
        {
            return ChangePasswordResult.CurrentPasswordIncorrect;
        }

        if (BCrypt.Net.BCrypt.Verify(
                dto.NewPassword,
                user.PasswordHash))
        {
            return ChangePasswordResult.NewPasswordMatchesCurrent;
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.SessionVersion++;

        await _db.SaveChangesAsync(cancellationToken);
        return ChangePasswordResult.Success;
    }

    private IQueryable<User> ProfileQuery() =>
        _db.Users
            .Include(user => user.Role)
            .Include(user => user.Team)
            .Include(user => user.Department);

    private static ProfileDto ToDto(User user) => new()
    {
        Id = user.Id,
        FirstName = user.Name,
        LastName = user.LastName,
        FullName = $"{user.Name} {user.LastName}".Trim(),
        Email = user.Email,
        Role = user.Role?.Name ?? Roles.User,
        TeamName = user.Team?.Name,
        DepartmentName = user.Department?.Name,
        CreatedAt = user.CreatedAt,
        AvatarUrl = BuildAvatarUrl(user.AvatarFileName)
    };

    private static string? BuildAvatarUrl(string? avatarFileName) =>
        string.IsNullOrWhiteSpace(avatarFileName)
            ? null
            : $"/uploads/avatars/{Uri.EscapeDataString(avatarFileName)}";

    private string GetAvatarDirectory() => Path.Combine(
        _environment.WebRootPath ??
            Path.Combine(_environment.ContentRootPath, "wwwroot"),
        "uploads",
        "avatars");

    private static async Task<string> GetVerifiedExtensionAsync(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        var normalizedContentType = file.ContentType.Trim().ToLowerInvariant();
        var header = new byte[12];

        await using var source = file.OpenReadStream();
        var bytesRead = await source.ReadAsync(
            header.AsMemory(0, header.Length),
            cancellationToken);

        var matchesContent = normalizedContentType switch
        {
            "image/jpeg" =>
                bytesRead >= 3 &&
                header[0] == 0xFF &&
                header[1] == 0xD8 &&
                header[2] == 0xFF,
            "image/png" =>
                bytesRead >= 8 &&
                header[0] == 0x89 &&
                header[1] == 0x50 &&
                header[2] == 0x4E &&
                header[3] == 0x47 &&
                header[4] == 0x0D &&
                header[5] == 0x0A &&
                header[6] == 0x1A &&
                header[7] == 0x0A,
            "image/webp" =>
                bytesRead >= 12 &&
                header[0] == 0x52 &&
                header[1] == 0x49 &&
                header[2] == 0x46 &&
                header[3] == 0x46 &&
                header[8] == 0x57 &&
                header[9] == 0x45 &&
                header[10] == 0x42 &&
                header[11] == 0x50,
            _ => false
        };

        if (!matchesContent)
        {
            throw new ArgumentException(
                "The uploaded file content does not match a supported image format.");
        }

        return normalizedContentType switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => throw new ArgumentException("Unsupported avatar format.")
        };
    }

    private static void TryDeleteFile(string physicalPath)
    {
        try
        {
            if (File.Exists(physicalPath))
                File.Delete(physicalPath);
        }
        catch (IOException)
        {
            // The database remains authoritative. A locked orphan can be cleaned later.
        }
        catch (UnauthorizedAccessException)
        {
            // The profile operation must not fail after the database was committed.
        }
    }
}
