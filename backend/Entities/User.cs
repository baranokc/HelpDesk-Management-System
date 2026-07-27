using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;

namespace backend.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DepartmentId { get; set; }
    public Guid? ManagerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Department Department { get; set; } = null!;
    public User? Manager { get; set; }
   

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>();

    public ICollection<Ticket> CreatedTickets { get; set; } = new List<Ticket>();
    public ICollection<Ticket> AssignedTickets { get; set; } = new List<Ticket>();
    public ICollection<User> DirectReports { get; set; } = new List<User>();
    public Guid? RoleId { get; set; } 
    public Role? Role { get; set; } 
}