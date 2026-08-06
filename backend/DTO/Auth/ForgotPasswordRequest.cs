using System.ComponentModel.DataAnnotations;

namespace backend.DTO.Auth;

public sealed class ForgotPasswordRequest
{
    [Required(ErrorMessage = "Email address is required.")]
    [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
    public string Email { get; set; } = string.Empty;
}
