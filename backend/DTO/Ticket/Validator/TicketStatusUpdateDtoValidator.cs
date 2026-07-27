using FluentValidation;
namespace backend.DTO.Ticket.Validator;
public class TicketStatusUpdateDtoValidator : AbstractValidator<TicketStatusUpdateDto>
{
    TicketStatusUpdateDtoValidator()
    {
        RuleFor(x => x.Reason)
            .MaximumLength(250).When(x => !string.IsNullOrWhiteSpace(x.Reason))
            .WithMessage("Atama nedeni en fazla 250 karakter olabilir.");
        RuleFor(x => x.StatusId)
            .NotEmpty().WithMessage("Yeni ticket durumu seçilmesi gerekmektedir.");
    }
}
