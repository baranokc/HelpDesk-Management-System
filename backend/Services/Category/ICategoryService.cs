using backend.DTO.Category;

namespace backend.Services.Category;

public interface ICategoryService
{
    Task<IReadOnlyCollection<CategoryAdminDto>> GetAllCategoriesAsync(
        CancellationToken cancellationToken = default);

    Task<CategoryAdminDto?> GetCategoryByIdAsync(
        Guid categoryId,
        CancellationToken cancellationToken = default);

    Task<CategoryAdminDto> CreateCategoryAsync(
        CategoryUpsertDto dto,
        CancellationToken cancellationToken = default);

    Task<CategoryAdminDto?> UpdateCategoryAsync(
        Guid categoryId,
        CategoryUpsertDto dto,
        CancellationToken cancellationToken = default);

    Task<CategoryAdminDto?> SetDefaultTeamAsync(
        Guid categoryId,
        Guid? teamId,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteCategoryAsync(
        Guid categoryId,
        CancellationToken cancellationToken = default);

    Task<CategoryAdminDto?> CreateSubcategoryAsync(
        Guid categoryId,
        SubcategoryUpsertDto dto,
        CancellationToken cancellationToken = default);

    Task<CategoryAdminDto?> UpdateSubcategoryAsync(
        Guid categoryId,
        Guid subcategoryId,
        SubcategoryUpsertDto dto,
        CancellationToken cancellationToken = default);

    Task<CategoryAdminDto?> DeleteSubcategoryAsync(
        Guid categoryId,
        Guid subcategoryId,
        CancellationToken cancellationToken = default);
}
