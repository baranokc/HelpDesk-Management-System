using backend.DTO.Auth;

namespace backend.Services.Auth;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(Login dto);
    Task<LoginResponse?> RefreshSessionAsync(Guid userId);
    Task<bool> RegisterAsync(UserCreate dto);
}
