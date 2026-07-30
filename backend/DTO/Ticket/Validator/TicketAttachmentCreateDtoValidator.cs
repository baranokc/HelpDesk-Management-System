
using FluentValidation;

namespace backend.DTO.Ticket.Validator;
public class TicketAttachmentCreateDtoValidator : AbstractValidator<TicketAttachmentCreateDto>
{
    private static readonly string [] AllowedExtensions = [
        ".jpg",
        ".jpeg",
        ".png", 
        ".pdf", 
        ".txt", 
        ".docx", 
        ".xlsx", 
        ".zip", 
        ".rar", 
        ".7z"];
    private const long MaxFileSizeBytes =
        10L * 1024 * 1024;

    private const long MaxTotalSizeBytes =
        100L * 1024 * 1024;
    private bool ValidFileSize(IFormFile? file)
    {   
        return file is not null && file.Length > 0 && file.Length <= MaxFileSizeBytes;
    }
    private bool ValidExtension(IFormFile? file)
    {
        if (file is null)
        return false;
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        return AllowedExtensions.Contains(extension);
    }
    public TicketAttachmentCreateDtoValidator()
    {
        RuleFor(x => x.Files)
            .NotEmpty()
            .WithMessage("At least one file must be selected.")
            .Must(files => files.Count <= 10)
            .WithMessage("At most 10 files can be uploaded.")
            .Must(files =>
                files.Sum(file => file.Length) <= MaxTotalSizeBytes)
            .WithMessage("The total attachment size cannot exceed 100 MB.");

        RuleForEach(x => x.Files)
            .Must(ValidFileSize)
            .WithMessage("Each file must be between 1 byte and 10 MB.")
            .Must(ValidExtension)
            .WithMessage("The selected file type is not supported.");

        RuleFor(x => x.CommentId)
            .NotEqual(Guid.Empty)
            .When(x => x.CommentId.HasValue)
            .WithMessage("Comment ID is invalid.");

        RuleFor(x => x.Description)
            .MaximumLength(100)
            .When(x => !string.IsNullOrWhiteSpace(x.Description))
            .WithMessage("File description cannot exceed 100 characters.");
    }
}