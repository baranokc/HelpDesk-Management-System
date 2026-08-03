namespace backend.Entities;

public class TicketCategory
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public Guid? DefaultTeamId { get; set; }
    public Team? DefaultTeam { get; set; }
    public ICollection<TicketSubCategory> Subcategories { get; set; } = new List<TicketSubCategory>();
}
