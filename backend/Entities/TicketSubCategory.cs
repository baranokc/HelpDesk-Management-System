namespace backend.Entities;

public class TicketSubCategory
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CategoryId { get; set; }
    public TicketCategory Category { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

