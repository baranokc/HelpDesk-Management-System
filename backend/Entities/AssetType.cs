namespace backend.Entities;
public class AssetType
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public string name { get; set; } = string.Empty;
    public string description { get; set; } = string.Empty;
    public bool IsActive {get; set; } = true;
    public ICollection<Asset> Assets { get; set; } = new List<Asset>();

}
