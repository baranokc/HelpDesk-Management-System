namespace backend.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int? DepartmentId { get; set; }
    public Guid? ManagerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? AvatarFileName { get; set; }
    public int SessionVersion { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Department? Department { get; set; }
    public User? Manager { get; set; }

    public Guid? TeamId { get; set; }
    public Team? Team { get; set; }
   

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>();

    public ICollection<Ticket> CreatedTickets { get; set; } = new List<Ticket>();
    public ICollection<Ticket> AssignedTickets { get; set; } = new List<Ticket>();
    public ICollection<Ticket> ResolvedTickets { get; set; } = new List<Ticket>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<TeamChatMessage> TeamChatMessages { get; set; } = new List<TeamChatMessage>();
    public ICollection<User> DirectReports { get; set; } = new List<User>();
    public Guid? RoleId { get; set; } 
    public Role? Role { get; set; } 
}
