namespace backend.Entities;

public class SlaPolicy
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PriorityId {get; set; }
    public TicketPriority Priority { get; set; } = null!;
    public TimeSpan FirstResponseTime {get; set; }
    public TimeSpan ResolutionTime {get; set; }
    public bool IsActive {get; set; } = true;
    public string Description {get; set; } = string.Empty;
    public ICollection<SlaRecord> SlaRecords { get; set; } = new List<SlaRecord>();
}