namespace backend.Entities;

public class SlaRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TicketId {get; set; }
    public Ticket Ticket {get; set; } = null!;
    public Guid SlaPolicyId {get; set; }
    public SlaPolicy SlaPolicy {get; set; } = null!;
    public DateTime FirstResponseDueAt {get; set; }
    public DateTime? FirstResponseAt {get; set; }
    public DateTime ResolutionDueAt {get; set; }
    public DateTime? ResolutionAt {get; set; }
    public bool IsPaused {get; set; }
    public string PauseReason {get; set; } = string.Empty;
    public DateTime? PausedAt {get; set; }
    public DateTime? ResumedAt {get; set; }
    public ICollection<SlaPause> Pauses { get; set; } = new List<SlaPause>();
}
