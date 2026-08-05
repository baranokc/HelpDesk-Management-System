using FluentValidation;

namespace backend.DTO.Profile.Validator;

public class ChangePasswordDtoValidator : AbstractValidator<ChangePasswordDto>
{
    public ChangePasswordDtoValidator()
    {
        RuleFor(password => password.CurrentPassword)
            .NotEmpty()
            .WithMessage("Current password is required.");

        RuleFor(password => password.NewPassword)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .WithMessage("New password is required.")
            .MinimumLength(6)
            .WithMessage("New password must be at least 6 characters long.")
            .MaximumLength(128)
            .WithMessage("New password cannot exceed 128 characters.")
            .NotEqual(password => password.CurrentPassword)
            .WithMessage("New password must be different from the current password.");

        RuleFor(password => password.ConfirmNewPassword)
            .NotEmpty()
            .WithMessage("Password confirmation is required.")
            .Equal(password => password.NewPassword)
            .WithMessage("New password and confirmation do not match.");
    }
}
