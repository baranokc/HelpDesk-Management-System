namespace backend.Entities;

public class TicketSubCategories
{
    public Guid Id { get; set; }
    public int categoryId { get; set; }
    public string name { get; set; }
    public string description { get; set; }
    public bool isActive { get; set; }
}

