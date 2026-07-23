namespace backend.Entities;
public class AssetTypes
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public string name {get; set; }
    public string description {get; set; }
    public bool IsActive {get; set; } = true;
}
