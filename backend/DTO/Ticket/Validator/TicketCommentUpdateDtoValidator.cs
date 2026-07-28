using FluentValidation;

namespace backend.DTO.Ticket.Validator;

public class TicketCommentUpdateDtoValidator : AbstractValidator<TicketCommentUpdateDto>
{
    public TicketCommentUpdateDtoValidator()
    {
        RuleFor(x => x.Comment).NotEmpty().MaximumLength(4000);
    }
}
