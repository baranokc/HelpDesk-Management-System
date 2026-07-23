namespace backend.Entities;
public class AssetTypes
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public string name { get; set; } = string.Empty;
    public string description { get; set; } = string.Empty;
    public bool IsActive {get; set; } = true;
}
