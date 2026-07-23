namespace backend.Entities;

public class ImpactLevel
	{
	public Guid Id { get; set; } = Guid.NewGuid();
	public string Name { get; set; } = string.Empty;
	public int Order {  get; set; }	
	public bool IsActive { get; set; } = true;
	public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
	}

