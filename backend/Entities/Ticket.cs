namespace backend.Entities;

public class Ticket
{
    public Guid ID { get; set; }
    public string ticketNumber { get; set; } = null!;
    public string ticketTitle { get; set; } = null!;
    public string ticketDescription { get; set; } = null!;
    public int createdById { get; set; }
    public int? assignedToId { get; set; }
    public int teamId { get; set; }
    public int categoryId { get; set; }
    public int subcategoryId { get; set; }
    public int statusId { get; set; }
    public int priorityId { get; set; }
    public int impactLevelId { get; set; }
    public int urgencyLevelId { get; set; }
    public string subject { get; set; } = string.Empty;
    public DateTime createdAt { get; set; }
    public DateTime? firstResponseAt { get; set; }
    public DateTime? resolvedAt { get; set; }
    public DateTime? closedAt { get; set; }
    public DateTime slaDueAt { get; set; }
    public bool isDeleted { get; set; }
}
