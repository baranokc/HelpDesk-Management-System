
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
    public TicketAttachmentCreateDtoValidator()
    {
        RuleFor(x => x.Files)
            .NotEmpty().WithMessage("En az 1 dosya yüklenmesi gerekmekedir.")
            .Must(files => files.Count <= 10).WithMessage("Bir yoruma en fazla 10 dosya yükleyenebilir.");
        RuleForEach(x => x.Files)
            .Must(ValidFileSize).WithMessage("Dosyalar 100MB boyutunu geçemez")
            .Must(ValidExtension).WithMessage("Hatalı uzantılı dosya yüklediniz.");
        RuleFor(x => x.CommentId)
            .NotEqual(Guid.Empty).When(x => x.CommentId.HasValue)
            .WithMessage("Geçersiz Yorum Id.");
        RuleFor(x => x.Description)
            .MaximumLength(100).When(x => !string.IsNullOrWhiteSpace(x.Description))
            .WithMessage("Dosya açıklaması 100 karakterden uzun olamaz.");
    }
}