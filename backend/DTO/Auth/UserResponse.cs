namespace backend.DTO.Auth;

public class UserResponse
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? RoleName { get; set; }
    public string? TeamName { get; set; }
    public bool IsActive { get; set; } = true;
}