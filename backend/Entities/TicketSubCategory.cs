namespace backend.Entities;

public class TicketSubCategory
{
    public Guid Id { get; set; }
    public Guid categoryId { get; set; }
    public TicketCategory Category { get; set; } = null!;
    public string name { get; set; } = string.Empty;
    public string description { get; set; } = string.Empty;
    public bool isActive { get; set; }
}

