namespace backend.DTO.Ticket;
public class TicketUpdateDto
{
    public string TicketTitle {get; set; } = string.Empty;
    public string TicketDescription {get; set; } = string.Empty;
    public string Subject {get; set; } = string.Empty;
    public Guid CategoryId {get; set; }
    public Guid? SubcategoryId {get; set; }
    public Guid PriorityId {get; set; }
    public Guid ImpactLevelId {get; set; }
    public Guid UrgencyLevelId {get; set; }
}