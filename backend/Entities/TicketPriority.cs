namespace backend.Entities;

public class TicketPriority
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public TimeSpan ResponseTime { get; set; }
    public TimeSpan ResolutionTime { get; set; }
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>(); 
    public ICollection<SlaPolicy> SlaPolicies { get; set; } = new List<SlaPolicy>();

}
