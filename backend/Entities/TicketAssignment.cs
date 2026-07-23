namespace backend.Entities;

public class TicketAssignment
{
	public	Guid Id { get; set; } = Guid.NewGuid();
	public Guid TicketId {get; set; }
	public Ticket Ticket {get; set; } = null!;
	public Guid AssignedToId {get; set; }
	public TeamMember AssignedTo {get; set; } = null!;
	public Guid AssignedById {get; set; }
	public TeamMember AssignedBy {get; set; } = null!;

	public DateTime AssignedAt {get; set; } = DateTime.UtcNow;
}
