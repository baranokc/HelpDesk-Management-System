using System.IO.Compression;
using FluentValidation;
namespace backend.DTO.Ticket.Validator;

public class TicketCreateDtoValidator : AbstractValidator<TicketCreateDto>
{
    private static readonly string[] AllowedExtensions =
    [
        ".jpg",
        ".jpeg",
        ".png",
        ".pdf",
        ".txt",
        ".docx",
        ".xlsx",
        ".zip",
        ".rar",
        ".7z"
    ];

    private const long MaxFileSizeBytes =
        10L * 1024 * 1024;

    private const long MaxTotalSizeBytes =
        100L * 1024 * 1024;

    private static bool HasValidFileSize(IFormFile file)
    {
        return file.Length > 0 &&
               file.Length <= MaxFileSizeBytes;
    }

    private static bool HasValidExtension(IFormFile file)
    {
        var extension =
            Path.GetExtension(file.FileName)
                .ToLowerInvariant();

        return AllowedExtensions.Contains(extension);
    }

    public TicketCreateDtoValidator()
    {
        RuleFor(x => x.TicketTitle)
            .NotEmpty().WithMessage("Ticket title cannot be empty.")
            .MinimumLength(5).WithMessage("Ticket title cannot be shorter than 5 characters.")
            .MaximumLength(50).WithMessage("Ticket title cannot be longer than 50 characters.");

        RuleFor(x => x.TicketDescription)
            .NotEmpty().WithMessage("Ticket summary cannot be empty.")
            .MinimumLength(5).WithMessage("Ticket summary cannot be shorter than 5 characters.")
            .MaximumLength(10000).WithMessage("Ticket summary cannot be longer than 10,000 characters.");

        RuleFor(x => x.Subject)
            .NotEmpty().WithMessage("Ticket description cannot be empty.")
            .MinimumLength(5).WithMessage("Ticket description cannot be shorter than 5 characters.")
            .MaximumLength(10000).WithMessage("Ticket description cannot be longer than 10,000 characters.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category selection is required.");

        RuleFor(x => x.SubcategoryId)
            .NotEqual(Guid.Empty)
            .When(x => x.SubcategoryId.HasValue)
            .WithMessage("A valid subcategory must be selected.");

        RuleFor(x => x.PriorityId)
            .NotEmpty().WithMessage("Priority selection is required.");

        RuleFor(x => x.ImpactLevelId)
            .NotEmpty().WithMessage("Impact level selection is required.");

        RuleFor(x => x.UrgencyLevelId)
            .NotEmpty()
            .WithMessage("Urgency level selection is required.");

        RuleFor(x => x.Attachments)
            .Must(files => files.Count <= 10)
            .WithMessage("A maximum of 10 files can be uploaded to a ticket.")
            .Must(files =>
                files.Sum(file => file.Length) <=
                MaxTotalSizeBytes)
            .WithMessage("The total file size cannot exceed 100 MB.");

        RuleForEach(x => x.Attachments)
            .Must(HasValidFileSize)
            .WithMessage("File cannot be empty or exceed 10 MB.")
            .Must(HasValidExtension)
            .WithMessage("Unsupported file extension.");
    }
}
