namespace backend.Entities;

public class TeamMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TeamId { get; set; }
    public Team Team { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public TeamMemberRole RoleInTeam {get; set; } = TeamMemberRole.Member;
    public bool IsActive { get; set; } = true;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public ICollection<TicketAssignment> AssignmentsReceived { get; set; } = new List<TicketAssignment>();

    public ICollection<TicketAssignment> AssignmentsCreated { get; set; }  = new List<TicketAssignment>();
}   
