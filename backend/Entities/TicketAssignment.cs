namespace backend.Entities;

public class TicketAssignment
{
	public	Guid Id { get; set; } = Guid.NewGuid();
	public Guid TicketId {get; set; }
	public Ticket Ticket {get; set; } = null!;
	public Guid TeamId { get; set; }
	public Team Team { get; set; } = null!;
	public Guid? AssignedToId { get; set; }
	public TeamMember? AssignedToTeamMember {get; set; }
	public Guid AssignedById {get; set; }
	public TeamMember AssignedByTeamMember {get; set; } = null!;

	public DateTime AssignedAt {get; set; } = DateTime.UtcNow;
}
