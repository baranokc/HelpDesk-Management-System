using FluentValidation;

namespace backend.DTO.Profile.Validator;

public class AvatarUploadDtoValidator : AbstractValidator<AvatarUploadDto>
{
    private const long MaximumAvatarSize = 2L * 1024 * 1024;

    private static readonly HashSet<string> AllowedContentTypes =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png",
            "image/webp"
        };

    public AvatarUploadDtoValidator()
    {
        RuleFor(upload => upload.File)
            .Cascade(CascadeMode.Stop)
            .NotNull()
            .WithMessage("An avatar file is required.")
            .Must(file => file.Length > 0)
            .WithMessage("The avatar file cannot be empty.")
            .Must(file => file.Length <= MaximumAvatarSize)
            .WithMessage("The avatar file cannot exceed 2 MB.")
            .Must(file => AllowedContentTypes.Contains(file.ContentType))
            .WithMessage("Only JPEG, PNG, and WebP avatar files are allowed.");
    }
}
