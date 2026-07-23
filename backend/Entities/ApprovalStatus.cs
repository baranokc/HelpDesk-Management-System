namespace backend.Entities;
public class ApprovalStatus
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public bool IsFinal {get; set; }
    public bool IsActive {get; set; } = true;
}