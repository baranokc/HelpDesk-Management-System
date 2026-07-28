
namespace backend.Entities;

public class Department
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public int? ParentDepartmentId { get; set; }

    public Department? ParentDepartment { get; set; }
    public ICollection<Department> SubDepartments { get; set; } = new List<Department>();

    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Team> Teams { get; set; } = new List<Team>();
}