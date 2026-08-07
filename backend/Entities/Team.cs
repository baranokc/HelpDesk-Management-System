namespace backend.Entities;

public class Team
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int DepartmentId { get; set; }
    public Department Department { get; set; } = null!;

    public Guid? LeadId { get; set; }
    public User? Lead { get; set; }

    public Guid? SlaCalendarId { get; set; }
    public SlaCalendar? SlaCalendar { get; set; }

    public ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>();
    public ICollection<TeamChatMessage> ChatMessages { get; set; } = new List<TeamChatMessage>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    public ICollection<TicketCategory> TicketCategories { get; set; } = new List<TicketCategory>();
}
