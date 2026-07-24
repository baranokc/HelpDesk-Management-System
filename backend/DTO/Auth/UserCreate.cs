using System.ComponentModel.DataAnnotations;

namespace backend.DTO.Auth;

public class UserCreate
{
    [Required(ErrorMessage = "Email adress is required")]
    [EmailAddress(ErrorMessage = "Please try again with a valid email adress")]
    public string Email { get; set; } = string.Empty;
    [Required(ErrorMessage = "Password is required")]
    [MinLength(6, ErrorMessage = "The password must be 6 characters long")]
    public string Password { get; set; } = string.Empty;
    [Required(ErrorMessage = "Name is required")]
    public string Name { get; set; } = string.Empty;
    [Required(ErrorMessage = "Last name is required")]
    public string LastName { get; set; } = string.Empty;
}