using Microsoft.AspNetCore.Authentication;

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

    public ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}