using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;

namespace backend.Entities;

public class Role
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}