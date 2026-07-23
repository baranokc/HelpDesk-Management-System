namespace backend.Entities;

public class Assets
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public Guid assetTypeId {get; set; }
    public AssetTypes AssetType {get; set; }
    public string serialNumber {get; set; } = string.Empty;
    public string brand {get; set; } = string.Empty;
    public string model {get; set; } = string.Empty;
    public AssetStatus status {get; set; }
    public DateTime purchaseDate {get; set; }
    public DateTime warrantyEndDate {get; set; }
    public string location {get; set; }
    public string notes {get; set; }

}