namespace backend.Entities;

public class Asset
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public Guid assetTypeId {get; set; }
    public AssetType AssetType {get; set; } = null!;
    public string serialNumber {get; set; } = string.Empty;
    public string brand {get; set; } = string.Empty;
    public string model {get; set; } = string.Empty;
    public AssetStatus status {get; set; }
    public DateTime purchaseDate {get; set; }
    public DateTime warrantyEndDate {get; set; }
    public string location {get; set; } = string.Empty;
    public string notes {get; set; } = string.Empty;
    public ICollection<AssetAssignment> Assignments { get; set; } = new List<AssetAssignment>();

}