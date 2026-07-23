namespace backend.Entities;

public class AssetAssignment
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AssetId {get; set; }
    public Asset Asset { get; set; } = null!;
    public Guid UserId {get; set; }
    public User User { get; set; } = null!;
    public DateTime AssignedAt {get; set; } = DateTime.UtcNow;
    public DateTime? ReturnedAt {get; set; }
    public string Notes {get; set; } =string.Empty;

}