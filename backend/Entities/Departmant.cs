
namespace backend.Entities;

public class Department
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid? ParentDepartmentId { get; set; }

    public Department? ParentDepartment { get; set; }
    public ICollection<Department> SubDepartments { get; set; } = new List<Department>();

    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Team> Teams { get; set; } = new List<Team>();
}