namespace backend.Entities;

public class SlaPolicy
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid priorityId {get; set; }
    public TicketPriority Priority { get; set; } = null!;
    public TimeSpan firstResponseTime {get; set; }
    public TimeSpan resolutionTime {get; set; }
    public bool isActive {get; set; } = true;
    public string description {get; set; } = string.Empty;
    public ICollection<SlaRecord> SlaRecords { get; set; } = new List<SlaRecord>();
}