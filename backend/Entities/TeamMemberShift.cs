namespace backend.Entities;

public class TeamMemberShift
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TeamMemberId { get; set; }
    public TeamMember TeamMember { get; set; } = null!;
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
}
