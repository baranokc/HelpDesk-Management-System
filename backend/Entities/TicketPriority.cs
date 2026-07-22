namespace backend.Entities;

public class TicketPriority
{
    public Guid Id { get; set; }
    public string name { get; set; }
    public int responseTime { get; set; }
    public int resolutionTime { get; set; }

}
