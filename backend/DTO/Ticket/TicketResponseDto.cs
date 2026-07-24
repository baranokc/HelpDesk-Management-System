namespace backend.DTO.Ticket;
public class TicketResponseDto
{
    public Guid Id {get; set; }
    public string TicketTitle {get; set; } = string.Empty;
    public string TicketDescription {get; set; } = string.Empty;
    public string Subject {get; set; } = string.Empty;
    public string StatusName {get; set; } = string.Empty;
    public string PriorityName {get; set; } = string.Empty;
    public string CategoryName {get; set; } = string.Empty;
    public string CreatedByName {get; set; } = string.Empty;
    public string? AssignedToName {get; set; }
    public DateTime CreatedAt {get; set; }

}