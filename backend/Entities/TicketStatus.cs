namespace backend.Entities;

public class TicketStatus
{
    public Guid Id { get; set; }
    public string name { get; set; }
    public string description { get; set; }
    public bool isActive { get; set; }
    public bool isClosed { get; set; }
}
