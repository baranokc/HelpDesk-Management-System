namespace backend.Entities;

public class AssetStatus
{ 
   	public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ColorCode { get; set; }
    public ICollection<Asset> Assets {get; set; } = new List<Asset>();
}