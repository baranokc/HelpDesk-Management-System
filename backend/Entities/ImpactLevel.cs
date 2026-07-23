namespace backend.Entities;

public class ImpactLevel
	{
	public Guid Id { get; set; }
	public string Name { get; set; } = string.Empty;
	public int order {  get; set; }	
	public bool isActive { get; set; } = true;
	}

