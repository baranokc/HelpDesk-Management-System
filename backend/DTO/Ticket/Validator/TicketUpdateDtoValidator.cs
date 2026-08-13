using System.IO.Compression;
using FluentValidation;
namespace backend.DTO.Ticket.Validator;
public class TicketUpdateDtoValidator : AbstractValidator<TicketUpdateDto>
{
    public TicketUpdateDtoValidator()
{
    RuleFor(x => x.TicketTitle)
        .NotEmpty().WithMessage("Ticket title cannot be empty.")
        .MinimumLength(5).WithMessage("Ticket title cannot be shorter than 5 characters.")
        .MaximumLength(50).WithMessage("Ticket title cannot be longer than 50 characters.");
    RuleFor(x => x.TicketDescription)
        .NotEmpty().WithMessage("Ticket summary cannot be empty.")
        .MinimumLength(5).WithMessage("Ticket summary cannot be shorter than 5 characters.")
        .MaximumLength(10000).WithMessage("Ticket summary cannot be longer than 10,000 characters.");
    RuleFor(x => x.Subject)
        .NotEmpty().WithMessage("Ticket description cannot be empty.")
        .MinimumLength(5).WithMessage("Ticket description cannot be shorter than 5 characters.")
        .MaximumLength(10000).WithMessage("Ticket description cannot be longer than 10,000 characters.");
    RuleFor(x => x.CategoryId)
        .NotEmpty().WithMessage("Category selection is required.");
    RuleFor(x => x.SubcategoryId)
        .NotEqual(Guid.Empty).When(x => x.SubcategoryId.HasValue).WithMessage("A valid subcategory must be selected.");
    RuleFor(x => x.PriorityId)
        .NotEmpty().WithMessage("Priority selection is required.");
    RuleFor(x => x.ImpactLevelId)
        .NotEmpty().WithMessage("Impact level selection is required.");
    RuleFor(x => x.UrgencyLevelId)
        .NotEmpty().WithMessage("Urgency level selection is required.");
}
}
