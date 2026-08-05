namespace backend.DTO.Category;

public sealed class SubcategoryUpsertDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}
