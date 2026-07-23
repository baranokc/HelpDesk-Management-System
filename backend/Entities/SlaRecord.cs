namespace backend.Entities;

public class SlaRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ticketId {get; set; }
    public Ticket Ticket {get; set; } = null!;
    public Guid policyId {get; set; }
    public SlaPolicy SlaPolicy {get; set; } = null!;
    public DateTime firstResponseDueAt {get; set; }
    public DateTime firstResponseAt {get; set; }
    public DateTime resolutionDueAt {get; set; }
    public DateTime resolutionAt {get; set; }
    public bool isPaused {get; set; } = true;
    public string pauseReason {get; set; } = string.Empty;
    public DateTime pausedAt {get; set; }
    public DateTime resumedAt {get; set; }
}