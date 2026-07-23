namespace backend.Entities;
public class ApprovalRequest
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TicketId {get; set; }
    public Ticket Ticket { get; set; } = null!;
    public RequestType RequestType {get; set; } 
    public string title {get; set; } = string.Empty;
    public string description {get; set; } = string.Empty;
    public Guid requestedById {get; set; }
    public User RequestedBy {get; set; } = null!;
    public DateTime requestedAt {get; set; } = DateTime.UtcNow;
    public Guid statusId {get; set; }
    public ApprovalStatus Status { get; set; } = null!;
    }