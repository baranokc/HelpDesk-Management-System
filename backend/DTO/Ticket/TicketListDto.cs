namespace backend.DTO.Ticket;
public class TicketListDto
{
    public Guid Id {get; set; }
    public string TicketNumber {get; set; } = string.Empty;
    public string TicketTitle {get; set; } = string.Empty;
    public string StatusName {get; set; } = string.Empty;
    public string PriorityName {get; set; } = string.Empty;
    public string CategoryName {get; set; } = string.Empty;
    public string? SubcategoryName {get; set; }
    public string CreatedByName {get; set; } = string.Empty;
    public string? AssignedToName {get; set; }
    public DateTime CreatedAt {get; set; }

}