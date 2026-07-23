namespace backend.Entities;

public class AssetAssignment
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public Guid assetId {get; set; }
    public Asset Asset {get; set; }
    public Guid userId {get; set; }
    public User User {get; set; }
    public DateTime assignedAt {get; set; }
    public DateTime returnedAt {get; set; }
    public string notes {get; set; } =string.Empty;
// 
}