namespace backend.DTO.Ticket;
public class TicketResolveDto
{
    public string Resolution {get; set; } = string.Empty;
    public Guid? ResolutionCategoryId {get; set;}
    public string? InternalNote {get; set; }
}