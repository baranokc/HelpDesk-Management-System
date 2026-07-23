namespace backend.Entities;

public class TicketSubCategory
{
    public Guid Id { get; set; }
    public int categoryId { get; set; }
    public string name { get; set; } = string.Empty;
    public string description { get; set; } = string.Empty;
    public bool isActive { get; set; }
}

