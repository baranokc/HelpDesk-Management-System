namespace backend.Entities;
public class AuditLog
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? userId {get; set; }
    public User? User {get; set; }
    public string action {get; set; } = string.Empty;
    public string entityName {get; set; } = string.Empty;
    public Guid? entityId {get; set; }
    public string? oldValues {get; set; }
    public string? newValues {get; set; }
    public string ipAddress { get; set; } = string.Empty;
    public DateTime createdAt {get; set; }
}