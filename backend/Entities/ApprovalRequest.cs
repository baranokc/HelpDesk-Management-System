namespace backend.Entities;
public class ApprovalRequest
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TicketId {get; set; }
    public Ticket Ticket { get; set; } = null!;
    public RequestType RequestType {get; set; } 
    public string Title {get; set; } = string.Empty;
    public string Description {get; set; } = string.Empty;
    public Guid RequestedById {get; set; }
    public User RequestedBy {get; set; } = null!;
    public DateTime RequestedAt {get; set; } = DateTime.UtcNow;
    public Guid StatusId {get; set; }
    public ApprovalStatus Status { get; set; } = null!;
    public ICollection<ApprovalRequestApprover> Approvers { get; set; } = new List<ApprovalRequestApprover>();
    }