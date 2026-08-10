using FluentValidation;
namespace backend.DTO.Ticket.Validator;

public class TicketFilterDtoValidator : AbstractValidator<TicketFilterDto>
{
    public TicketFilterDtoValidator ()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1).WithMessage("Sayfa sayısı en az 1 olabilir.");
        RuleFor(x => x.PageSize)
            .InclusiveBetween(1,100).WithMessage("Her sayfada en az 1 en çok 100 kayıt olabilir.");
        RuleFor(x => x.Search)
            .MaximumLength(200).When(x => x.Search is not null)
            .WithMessage("Arama metni en fazla 200 karakter olabilir");
        RuleFor(x => x.SortBy)
            .Must(sortBy => new[]
            {
                "ticketNumber",
                "title",
                "status",
                "priority",
                "createdBy"
            }.Contains(sortBy, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Geçersiz sıralama alanı.");
        RuleFor(x => x.SortDirection)
            .Must(direction =>
                string.Equals(direction, "asc", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(direction, "desc", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Sorting can only be descending or ascending.");
        RuleFor(x => x)
            .Must(x => !x.CreatedFrom.HasValue || !x.CreatedTo.HasValue || x.CreatedFrom <= x.CreatedTo)
            .WithMessage("End date can't be earlier than creation date.");
    }
}
