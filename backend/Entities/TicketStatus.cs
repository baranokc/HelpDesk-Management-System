namespace backend.Entities;

public class TicketStatus
{
    public Guid Id { get; set; }
    public string name { get; set; } = string.Empty;
    public string description { get; set; } = string.Empty;
    public bool isActive { get; set; } = true;
    public bool isClosed { get; set; }
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
