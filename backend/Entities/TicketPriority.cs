namespace backend.Entities;

public class TicketPriority
{
    public Guid Id { get; set; }
    public string name { get; set; } = string.Empty;
    public TimeSpan responseTime { get; set; }
    public TimeSpan resolutionTime { get; set; }
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>(); 
    public ICollection<SlaPolicy> SlaPolicies { get; set; } = new List<SlaPolicy>();

}
