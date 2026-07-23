namespace backend.Entities;
public class ApprovalRequestApprover
{
	public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RequestId {get; set; }
    public ApprovalRequest Request {get; set; }
    public Guid ApproverId {get; set; }
    public User Approver {get; set; }
    public int orderNo {get; set; }
    public DateTime respondedAt {get; set; } = DateTime.UtcNow;
    public ApprovalStatus Status {get; set; }
}