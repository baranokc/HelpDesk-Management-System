namespace backend.Entities;
public class ApprovalStatus
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public string name { get; set; } = string.Empty;
    public bool isFinal {get; set; } = true;
    public bool isActive {get; set; }
}