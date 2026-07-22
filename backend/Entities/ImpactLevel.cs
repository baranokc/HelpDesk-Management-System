namespace backend.Entities;

public class ImpactLevel
	{
	public Guid ID { get; set; }
	public string Name { get; set; }
	public int order {  get; set; }	
	public bool isActive { get; set; }
	}
}
