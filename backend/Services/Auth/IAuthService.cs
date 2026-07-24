using backend.DTO.Auth;

namespace backend.Services.Auth;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(Login dto);
    Task<bool> RegisterAsync(UserCreate dto);
}