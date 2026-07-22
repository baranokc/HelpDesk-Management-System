namespace backend.Entities;

public class TicketCategory
{
    public Guid Id { get; set; }
    public int parentCategoryId { get; set; }
    public string name { get; set; } = string.Empty;
    public string description { get; set; } = string.Empty;
    public bool isActive { get; set; }
}
