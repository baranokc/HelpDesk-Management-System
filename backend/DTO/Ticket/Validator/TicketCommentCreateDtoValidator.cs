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
    private const long MaxFileSizeBytes = 100 * 1024 * 1024;
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

    public TicketCommentCreateDtoValidator ()
    {
        RuleFor(x => x.Comment)
            .NotEmpty().WithMessage("Boş yorum yapılamaz.")
            .MaximumLength(1000).WithMessage("Yorum 1000 karakterden uzun olamaz.");
        RuleForEach(x => x.Attachments)
            .Must(ValidFileSize).WithMessage("Dosyalar 100MB boyutunu geçemez")
            .Must(ValidExtension).WithMessage("Hatalı uzantılı dosya yüklediniz.");
        RuleFor(x => x.Attachments)
            .Must(files => files.Count <= 10).WithMessage("Bir yoruma en fazla 10 dosya yükleyenebilir.");
    }   
}
