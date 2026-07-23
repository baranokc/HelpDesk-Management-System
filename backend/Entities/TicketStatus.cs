namespace backend.Entities;

public class TicketStatus
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool IsClosed { get; set; }
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
