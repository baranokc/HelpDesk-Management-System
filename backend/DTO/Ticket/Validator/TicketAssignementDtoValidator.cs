using FluentValidation;
namespace backend.DTO.Ticket.Validator;
public class TicketAssignmentDtoValidator : AbstractValidator<TicketAssignmentDto>
{
    public TicketAssignmentDtoValidator()
    {
        RuleFor(x => x.TeamId)
            .NotEmpty().WithMessage("Atanacak takımı seçmeniz gerekmektedir");
        RuleFor(x => x.TeamMemberId)
            .NotEqual(Guid.Empty).When(x => x.TeamMemberId.HasValue)
            .WithMessage("Geçersiz bir Takım Üyesi ID seçitiniz.");
        RuleFor(x => x.Reason)
            .MaximumLength(250).When(x => !string.IsNullOrWhiteSpace(x.Reason))
            .WithMessage("Atama nedeni en fazla 250 karakter olabilir.");
    }
}
