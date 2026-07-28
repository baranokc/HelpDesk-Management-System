using FluentValidation;

namespace backend.DTO.Ticket.Validator;

public class TicketAttachmentUpdateDtoValidator : AbstractValidator<TicketAttachmentUpdateDto>
{
    public TicketAttachmentUpdateDtoValidator()
    {
        RuleFor(x => x.Description).MaximumLength(500);
    }
}
