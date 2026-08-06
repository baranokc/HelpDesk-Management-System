namespace backend.Entities;

public class TeamMemberLeave
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TeamMemberId { get; set; }
    public TeamMember TeamMember { get; set; } = null!;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Reason { get; set; } = string.Empty;
    public Guid CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
