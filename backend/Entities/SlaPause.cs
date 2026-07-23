namespace backend.Entities;

public class SlaPause
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid slaRecordId {get; set; }
    public SlaRecord SlaRecord { get; set; } = null!;
    public Guid pausedBy {get; set; }
    public User PausedBy { get; set; } = null!;
    public string reason {get; set; } = string.Empty;
    public DateTime pausedAt {get; set; } = DateTime.UtcNow;
    public DateTime? resumedAt {get; set; }

}