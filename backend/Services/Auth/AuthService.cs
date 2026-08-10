using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Reflection.Metadata;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using backend.Data;
using backend.Constants;
using backend.DTO.Auth;
using backend.Entities;
using backend.Services.Email;
using BCrypt.Net;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Logging;

namespace backend.Services.Auth;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AppDbContext context,
        IConfiguration configuration,
        IEmailService emailService,
        ILogger<AuthService> logger)
    {
        _context = context;
        _configuration = configuration;
        _emailService = emailService;
        _logger = logger;
    }
    public async Task<LoginResponse?> LoginAsync(Login dto)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var user = await _context.Users
        .Include(u => u.Role)
        .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (user == null || !user.IsActive) return null;
        if (user.Role is not null && !user.Role.IsActive) return null;

        bool IsPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
        if (!IsPasswordValid) return null;
        return await CreateLoginResponseAsync(user);

    }

    public async Task<LoginResponse?> RefreshSessionAsync(Guid userId)
    {
        var user = await _context.Users
            .Include(item => item.Role)
            .SingleOrDefaultAsync(item => item.Id == userId);

        if (user is null ||
            !user.IsActive ||
            user.Role is null ||
            !user.Role.IsActive)
        {
            return null;
        }

        return await CreateLoginResponseAsync(user);
    }

    private async Task<LoginResponse> CreateLoginResponseAsync(User user)
    {
        IReadOnlyCollection<Guid> ledTeamIds =
            user.Role?.Name == Roles.TeamLeader
            ? await _context.TeamMembers
                .AsNoTracking()
                .Where(teamMember =>
                    teamMember.UserId == user.Id &&
                    teamMember.RoleInTeam == TeamMemberRole.TeamLeader &&
                    teamMember.IsActive &&
                    teamMember.Team.IsActive)
                .Select(teamMember => teamMember.TeamId)
                .Distinct()
                .ToListAsync()
            : Array.Empty<Guid>();

        return new LoginResponse
        {
            Token = GenerateJwtToken(user, ledTeamIds),
            Email = user.Email,
            FullName = $"{user.Name} {user.LastName}",
            AvatarUrl = string.IsNullOrWhiteSpace(user.AvatarFileName)
                ? null
                : $"/uploads/avatars/{Uri.EscapeDataString(user.AvatarFileName)}",
            Role = user.Role?.Name ?? Roles.User,
        };
    }
    private string GenerateJwtToken(User user, IReadOnlyCollection<Guid> ledTeamIds)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var key = Encoding.UTF8.GetBytes(jwtSettings["Secret"]!);
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString() ),
            new Claim(ClaimTypes.Email , user.Email),
            new Claim(ClaimTypes.Role , user.Role?.Name ?? "User"),
            new Claim("session_version", user.SessionVersion.ToString()),
            new Claim("led_team_ids",string.Join(",", ledTeamIds.Select(teamId => teamId.ToString())))
        };
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(8),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"]
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
    public async Task<bool> RegisterAsync(UserCreate dto)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (existingUser != null)
        {
            return false;
        }
        var departmentExists = await _context.Departments
            .AnyAsync(department =>
                department.Id == dto.DepartmentId &&
                department.IsActive);

        if (!departmentExists)
        {
            throw new ArgumentException(
                "Selected department was not found or is inactive.");
        }
        string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

        var defaultRole = await _context.Roles
            .SingleOrDefaultAsync(role =>
                role.Name == Roles.User && role.IsActive)
            ?? throw new InvalidOperationException(
                "The active default User role was not found.");

        var newUser = new User
        {
            Email = normalizedEmail,
            PasswordHash = passwordHash,
            Name = dto.Name,
            LastName = dto.LastName,
            DepartmentId = dto.DepartmentId,
            RoleId = defaultRole.Id,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Users.AddAsync(newUser);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task ForgotPasswordAsync(
        ForgotPasswordRequest dto,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.SingleOrDefaultAsync(
            item => item.IsActive && item.Email.ToLower() == normalizedEmail,
            cancellationToken);

        if (user is null)
            return;

        var utcNow = DateTime.UtcNow;
        var previousTokens = await _context.PasswordResetTokens
            .Where(token => token.UserId == user.Id && token.UsedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var previousToken in previousTokens)
            previousToken.UsedAt = utcNow;

        var rawToken = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        var passwordResetToken = new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = CreateTokenHash(rawToken),
            CreatedAt = utcNow,
            ExpiresAt = utcNow.AddMinutes(30)
        };

        await _context.PasswordResetTokens.AddAsync(passwordResetToken, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        await _emailService.SendRegistrationEmailAsync(user.Email, $"{user.Name} {user.LastName}", cancellationToken);

        var frontendBaseUrl = _configuration["Frontend:BaseUrl"]?.TrimEnd('/');
        if (string.IsNullOrWhiteSpace(frontendBaseUrl))
            throw new InvalidOperationException("Frontend:BaseUrl configuration is missing.");

        var resetLink =
            $"{frontendBaseUrl}/reset-password" +
            $"?email={Uri.EscapeDataString(user.Email)}" +
            $"&token={Uri.EscapeDataString(rawToken)}";

        try
        {
            await _emailService.SendPasswordResetEmailAsync(
                user.Email,
                $"{user.Name} {user.LastName}".Trim(),
                resetLink,
                cancellationToken);
        }
        catch
        {
            passwordResetToken.UsedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
            throw;
        }
    }

    public async Task<bool> ResetPasswordAsync(
        ResetPasswordRequest dto,
        CancellationToken cancellationToken = default)
    {
        if (dto.NewPassword != dto.ConfirmNewPassword)
            return false;

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var utcNow = DateTime.UtcNow;
        var user = await _context.Users.SingleOrDefaultAsync(
            item => item.IsActive && item.Email.ToLower() == normalizedEmail,
            cancellationToken);

        if (user is null)
            return false;

        var tokenHash = CreateTokenHash(dto.Token);
        var passwordResetToken = await _context.PasswordResetTokens.SingleOrDefaultAsync(
            token =>
                token.UserId == user.Id &&
                token.TokenHash == tokenHash &&
                token.UsedAt == null &&
                token.ExpiresAt > utcNow,
            cancellationToken);

        if (passwordResetToken is null)
            return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.SessionVersion++;

        var activeTokens = await _context.PasswordResetTokens
            .Where(token => token.UserId == user.Id && token.UsedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var activeToken in activeTokens)
            activeToken.UsedAt = utcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static string CreateTokenHash(string token)
    {
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(hashBytes);
    }
}
