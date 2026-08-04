namespace backend.DTO.Category;

public sealed class CategoryAdminDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public Guid? DefaultTeamId { get; set; }
    public string? DefaultTeamName { get; set; }
    public int SubcategoryCount { get; set; }
}
