namespace backend.Entities;

public class Ticket
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string TicketNumber { get; set; } = string.Empty;
    public string TicketTitle { get; set; } = string.Empty;
    public string TicketDescription { get; set; } = string.Empty;
    public Guid CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;
    public Guid? AssignedToId { get; set; }
    public User? AssignedTo {get; set; }
    public Guid? TeamId { get; set; }
    public Team? Team {get; set; }
    public Guid CategoryId { get; set; }
    public TicketCategory Category {get; set; } = null!;
    public Guid? SubcategoryId { get; set; }
    public TicketSubCategory? Subcategory { get; set; }
    public Guid StatusId { get; set; }
    public TicketStatus Status { get; set; } = null!;
    public Guid PriorityId { get; set; }
    public TicketPriority Priority { get; set; } = null!;
    public Guid ImpactLevelId { get; set; }
    public ImpactLevel ImpactLevel { get; set; } = null!;
    public Guid UrgencyLevelId { get; set; }
    public UrgencyLevel UrgencyLevel { get; set; } = null!;
    public string Subject { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? FirstResponseAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public DateTime? SlaDueAt { get; set; }
    public Guid? ResolvedById {get; set; }
    public User? ResolvedBy { get; set; }
    public string? Resolution { get; set; }
    public Guid? ResolutionCategoryId { get; set; }
    public ResolutionCategory? ResolutionCategory { get; set; }
    public bool IsDeleted { get; set; }
    public ICollection<TicketAssignment> Assignments { get; set; } = new List<TicketAssignment>(); 
    public ICollection<TicketComment> Comments { get; set; } = new List<TicketComment>();
    public ICollection<SlaRecord> SlaRecords { get; set; } = new List<SlaRecord>();
}
