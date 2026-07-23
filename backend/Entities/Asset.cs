namespace backend.Entities;

public class Asset
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AssetTypeId {get; set; }
    public AssetType AssetType {get; set; } = null!;
    public string SerialNumber {get; set; } = string.Empty;
    public string Brand {get; set; } = string.Empty;
    public string Model {get; set; } = string.Empty;
    public Guid AssetStatusId {get; set; }
    public AssetStatus AssetStatus { get; set; } = null!;
    public DateOnly? PurchaseDate {get; set; }
    public DateOnly? WarrantyEndDate {get; set; }
    public string Location {get; set; } = string.Empty;
    public string Notes {get; set; } = string.Empty;
    public ICollection<AssetAssignment> Assignments { get; set; } = new List<AssetAssignment>();

}