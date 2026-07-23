namespace backend.DTO.Ticket;
public class TicketDetailDto
{
    public Guid Id {get; set; }
    public string TicketNumber {get; set; } = string.Empty;
    public string Title {get; set; } = string.Empty;
    public string Description {get; set; } = string.Empty;
    public Guid StatusId {get; set; }
    public string StatusName {get; set; } = string.Empty;
    public Guid PriorityId {get; set; }
    public string PriorityName {get; set; } = string.Empty;
    public Guid CategoryId {get; set; }
    public string CategoryName {get; set; } = string.Empty;
    public Guid SubcategoryId {get; set; }
    public string SubcategoryName {get; set; } = string.Empty;
    public Guid ImpactLevelId {get; set; }
    public string ImpactLevelName {get; set; } = string.Empty;
    public Guid UrgencyLevelId {get; set; }
    public string UrgencyLevelName {get; set; } = string.Empty;
    public Guid CreatedById {get; set; }
    public string CreatedByName {get; set; } = string.Empty;
    public Guid? AssignedToId {get; set; }
    public string? AssignedToName {get; set; }
    public DateTime CreatedAt {get; set; }
    public DateTime? FirstResponseAt {get; set; }
    public DateTime? ResolvedAt {get; set; }
    public DateTime? ClosedAte {get; set; }
}