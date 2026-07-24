using FluentValidation;
namespace backend.DTO.Ticket.Validator;
public class TicketUnassignmentDtoValidator : AbstractValidator<TicketUnassignmentDto>
{
    public TicketUnassignmentDtoValidator()
    {
        RuleFor(x => x.Reason)
            .MaximumLength(250).When(x => !string.IsNullOrWhiteSpace(x.Reason))
            .WithMessage("Atama nedeni en fazla 250 karakter olabilir.");
    }
}




