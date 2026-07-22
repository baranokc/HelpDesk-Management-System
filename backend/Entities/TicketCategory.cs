namespace backend.Entities;

public class TicketCategory
{
    public Guid Id { get; set; }
    public int parentCategoryId { get; set; }
    public string name { get; set; }
    public string description { get; set; }
    public bool isActive { get; set; }
}
