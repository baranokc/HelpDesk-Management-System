namespace backend.DTO.Ticket;
public class TicketFilterDto
{
    public string? Search {get; set; }
    public Guid? StatusId {get; set; }
    public Guid? CategoryId {get; set; }
    public Guid? AssignedToId {get; set;}
    public Guid? CreatedById {get; set; }
    public Guid? UrgencyLevelId {get; set; }
    public Guid? ImpactLevelId {get; set; }
    public DateTime? CreatedFrom {get; set; }
    public DateTime? CreatedTo {get; set; }
    public int PageNumber {get; set; } = 1;
    public int PageSize {get; set; } = 25;
}