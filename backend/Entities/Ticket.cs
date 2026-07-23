namespace backend.Entities;

public class Ticket
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ticketNumber { get; set; } = null!;
    public string ticketTitle { get; set; } = null!;
    public string ticketDescription { get; set; } = null!;
    public Guid createdById { get; set; }
    public User CreatedBy {get; set; }
    public Guid? assignedToId { get; set; }
    public User? AssignedTo {get; set; }
    public Guid? teamId { get; set; }
    public Team? TeamId {get; set; }
    public Guid categoryId { get; set; }
    public TicketCategory Category {get; set; } = null!;
    public Guid? subcategoryId { get; set; }
    public TicketSubCategory Subcategory { get; set; }
    public Guid statusId { get; set; }
    public TicketStatus Status { get; set; } = null!;
    public Guid priorityId { get; set; }
    public TicketPriority Priority { get; set; }
    public Guid impactLevelId { get; set; }
    public ImpactLevel ImpactLevel { get; set; }
    public Guid urgencyLevelId { get; set; }
    public UrgencyLevel UrgencyLevel { get; set; }
    public string subject { get; set; } = string.Empty;
    public DateTime createdAt { get; set; } = DateTime.UtcNow;
    public DateTime? firstResponseAt { get; set; }
    public DateTime? resolvedAt { get; set; }
    public DateTime? closedAt { get; set; }
    public DateTime slaDueAt { get; set; }
    public bool isDeleted { get; set; }
    public ICollection<TicketAssignment> Assignments { get; set; } = new List<TicketAssignment>(); 
    public ICollection<SlaRecord> SlaRecords { get; set; } = new List<SlaRecord>();
}
