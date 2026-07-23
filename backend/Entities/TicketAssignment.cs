namespace backend.Entities;

public class TicketAssignment
{
	public	Guid Id { get; set; } = Guid.NewGuid();
	public Guid ticketId {get; set; }
	public Ticket Ticket {get; set; } = null!;
	public Guid assignedToId {get; set; }
	public TeamMember AssignedTo {get; set; } = null!;
	public Guid assignedById {get; set; }
	public TeamMember AssignedBy {get; set; } = null!;

	public DateTime assignedAt {get; set; } = DateTime.UtcNow;
}
