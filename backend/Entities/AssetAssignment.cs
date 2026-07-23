namespace backend.Entities;

public class AssetAssignment
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public Guid assetId {get; set; }
    public Asset AssetId { get; set; } = null!;
    public Guid userId {get; set; }
    public User UserId { get; set; } = null!;
    public DateTime AssignedAt {get; set; }
    public DateTime ReturnedAt {get; set; }
    public string Notes {get; set; } = string.Empty;
}