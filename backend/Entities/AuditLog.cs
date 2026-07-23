namespace backend.Entities;
public class AuditLog
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId {get; set; }
    public User? User {get; set; }
    public string Action {get; set; } = string.Empty;
    public string EntityName {get; set; } = string.Empty;
    public Guid? EntityId {get; set; }
    public string? OldValues {get; set; }
    public string? NewValues {get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAt {get; set; } = DateTime.UtcNow;
}