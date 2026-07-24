using FluentValidation;
namespace backend.DTO.Ticket.Validator;
public class TicketResolveDtoValidator : AbstractValidator<TicketResolveDto>
{
    public TicketResolveDtoValidator()
    {
        RuleFor(x => x.Resolution)
            .NotEmpty().WithMessage("Çözüm açıklanması zorunludur.")
            .MinimumLength(10).WithMessage("Çözüm açıklaması 10 karakterden kısa olamaz.")
            .MaximumLength(250).WithMessage("Çözüm açıklaması 250 karakterden uzun olamaz.");
        RuleFor(x => x.ResolutionCategoryId)
            .NotEqual(Guid.Empty).When(x => x.ResolutionCategoryId.HasValue)
            .WithMessage("Geçerli bir Çözüm Kategori ID girin.");
        RuleFor(x => x.InternalNote)
            .MaximumLength(250).When(x => !string.IsNullOrWhiteSpace(x.InternalNote))
            .WithMessage("Özel not 250 karakterden uzun olamaz.");
    }
}
