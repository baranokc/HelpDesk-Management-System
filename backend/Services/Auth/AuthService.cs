using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Reflection.Metadata;
using System.Security.Claims;
using System.Text;
using backend.Data;
using backend.Constants;
using backend.DTO.Auth;
using backend.Entities;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services.Auth;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
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

        var token = GenerateJwtToken(user);
        return new LoginResponse
        {
            Token = token,
            Email = user.Email,
            FullName = $"{user.Name} {user.LastName}",
            Role = user.Role?.Name ?? "User",
        };

    }
    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var key = Encoding.UTF8.GetBytes(jwtSettings["Secret"]!);
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString() ),
            new Claim(ClaimTypes.Email , user.Email),
            new Claim(ClaimTypes.Role , user.Role?.Name ?? "User"),
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
    
}
