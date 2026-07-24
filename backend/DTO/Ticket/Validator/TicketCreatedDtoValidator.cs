using System.IO.Compression;
using FluentValidation;
namespace backend.DTO.Ticket.Validator;
public class TicketCreateDtoValidator : AbstractValidator<TicketCreateDto>
{
    public TicketCreateDtoValidator()
    {
        RuleFor(x => x.TicketTitle)
            .NotEmpty().WithMessage("Ticket başlığı boş bırakılamaz.")
            .MinimumLength(5).WithMessage("Ticket başlığı 5 karakterden kısa olamaz.")
            .MaximumLength(50).WithMessage("Ticket başlığı 50 karakterden uzun olamaz.");
        RuleFor(x => x.TicketDescription)
            .NotEmpty().WithMessage("Ticket özetlemesi boş bırakılamaz.")
            .MinimumLength(5).WithMessage("Ticket özetlemesi 5 karakterden kısa olamaz.")
            .MaximumLength(100).WithMessage("Ticket özetlemesi 100 karakterden uzun olamaz.");
        RuleFor(x => x.Subject)
            .NotEmpty().WithMessage("Ticket açıklaması boş bırakılamaz.")
            .MinimumLength(5).WithMessage("Ticket açıklaması 5 karakterden kısa olamaz.")
            .MaximumLength(10000).WithMessage("Ticket açıklaması 10.000 karakterden uzun olamaz.");
        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Kategori seçilmesi zorunludur.");
        RuleFor(x => x.SubcategoryId)
            .NotEqual(Guid.Empty).When(x => x.SubcategoryId.HasValue).WithMessage("Geçerli bir alt kategori seçilmesi zorunludur");
        RuleFor(x => x.PriorityId)
            .NotEmpty().WithMessage("Öncelik seçilmesi zorunludur.");
        RuleFor(x => x.ImpactLevelId)
            .NotEmpty().WithMessage("Etki seviyesi seçilmesi zorunludur.");
        RuleFor(x => x.UrgencyLevelId)
            .NotEmpty().WithMessage("Aciliyet seviyesi seçilmesi zorunludur.");
    }
}
