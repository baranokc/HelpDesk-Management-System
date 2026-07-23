namespace backend.Entities;

public class SlaPause
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SlaRecordId {get; set; }
    public SlaRecord SlaRecord { get; set; } = null!;
    public Guid PausedById {get; set; }
    public User PausedBy { get; set; } = null!;
    public string Reason {get; set; } = string.Empty;
    public DateTime PausedAt {get; set; } = DateTime.UtcNow;
    public DateTime? ResumedAt {get; set; }

}