namespace backend.DTO.Category;

public sealed class CategoryUpsertDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? DefaultTeamId { get; set; }
}
