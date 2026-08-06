using System.ComponentModel.DataAnnotations;

namespace backend.DTO.Auth;

public sealed class ResetPasswordRequest
{
    [Required(ErrorMessage = "Email address is required.")]
    [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Reset token is required.")]
    public string Token { get; set; } = string.Empty;

    [Required(ErrorMessage = "New password is required.")]
    [MinLength(6, ErrorMessage = "The password must be at least 6 characters long.")]
    [MaxLength(128, ErrorMessage = "The password cannot exceed 128 characters.")]
    public string NewPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password confirmation is required.")]
    [Compare(nameof(NewPassword), ErrorMessage = "The password confirmation does not match.")]
    public string ConfirmNewPassword { get; set; } = string.Empty;
}
