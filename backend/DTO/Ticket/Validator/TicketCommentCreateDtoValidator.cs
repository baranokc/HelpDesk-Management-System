using System.IO.Compression;
using System.Net.Mail;
using FluentValidation;
namespace backend.DTO.Ticket.Validator;
public class TicketCommentCreateDtoValidator : AbstractValidator<TicketCommentCreateDto>
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

    public TicketCommentCreateDtoValidator()
    {
        RuleFor(x => x.Comment)
            .NotEmpty()
            .WithMessage("Comment cannot be empty.")
            .MaximumLength(1000)
            .WithMessage("Comment cannot exceed 1000 characters.");

        RuleForEach(x => x.Attachments)
            .Must(ValidFileSize)
            .WithMessage("Each file must be between 1 byte and 10 MB.")
            .Must(ValidExtension)
            .WithMessage("The selected file type is not supported.");

        RuleFor(x => x.Attachments)
            .Must(files => files.Count <= 10)
            .WithMessage("A comment can contain at most 10 files.")
            .Must(files =>
                files.Sum(file => file.Length) <= MaxTotalSizeBytes)
            .WithMessage("The total attachment size cannot exceed 100 MB.");
    }
}
