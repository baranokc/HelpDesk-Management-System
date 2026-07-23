namespace backend.Entities;

public class Assets
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public Guid assetTypeId {get; set; }
    public AssetTypes AssetType { get; set; } = null!;
    public string serialNumber {get; set; } = string.Empty;
    public string brand {get; set; } = string.Empty;
    public string model {get; set; } = string.Empty;
    public AssetAssignment status { get; set; } = null!;
    public DateTime purchaseDate {get; set; }
    public DateTime warrantyEndDate {get; set; }
    public string location { get; set; } = string.Empty;
    public string notes { get; set; } = string.Empty;

}