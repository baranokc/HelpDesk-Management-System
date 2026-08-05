using backend.Data;
using backend.DTO.Category;
using backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Category;

public sealed class CategoryService : ICategoryService
{
    private readonly AppDbContext _context;

    public CategoryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyCollection<CategoryAdminDto>>
        GetAllCategoriesAsync(
            CancellationToken cancellationToken = default)
    {
        return await CategoryQuery()
            .Where(category => category.IsActive)
            .OrderBy(category => category.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<CategoryAdminDto?> GetCategoryByIdAsync(
        Guid categoryId,
        CancellationToken cancellationToken = default)
    {
        return await CategoryQuery()
            .SingleOrDefaultAsync(
                category =>
                    category.Id == categoryId &&
                    category.IsActive,
                cancellationToken);
    }

    public async Task<CategoryAdminDto> CreateCategoryAsync(
        CategoryUpsertDto dto,
        CancellationToken cancellationToken = default)
    {
        await ValidateDtoAsync(dto, cancellationToken);

        var name = dto.Name.Trim();
        var normalizedName = name.ToLower();
        var existingCategory = await _context.TicketCategories
            .Include(category => category.Subcategories)
            .OrderByDescending(category => category.IsActive)
            .FirstOrDefaultAsync(
                category => category.Name.ToLower() == normalizedName,
                cancellationToken);

        if (existingCategory?.IsActive == true)
        {
            throw new InvalidOperationException(
                "An active category with this name already exists.");
        }

        TicketCategory category;
        if (existingCategory is not null)
        {
            category = existingCategory;
            category.Name = name;
            category.Description =
                dto.Description?.Trim() ?? string.Empty;
            category.DefaultTeamId = dto.DefaultTeamId;
            category.IsActive = true;

            foreach (var subcategory in category.Subcategories)
                subcategory.IsActive = true;
        }
        else
        {
            category = new TicketCategory
            {
                Name = name,
                Description =
                    dto.Description?.Trim() ?? string.Empty,
                DefaultTeamId = dto.DefaultTeamId,
                IsActive = true
            };

            _context.TicketCategories.Add(category);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return await GetCategoryDtoAsync(
            category.Id,
            cancellationToken);
    }

    public async Task<CategoryAdminDto?> UpdateCategoryAsync(
        Guid categoryId,
        CategoryUpsertDto dto,
        CancellationToken cancellationToken = default)
    {
        await ValidateDtoAsync(dto, cancellationToken);

        var category = await _context.TicketCategories
            .SingleOrDefaultAsync(
                item => item.Id == categoryId && item.IsActive,
                cancellationToken);

        if (category is null)
            return null;

        var name = dto.Name.Trim();
        var normalizedName = name.ToLower();
        var duplicateExists = await _context.TicketCategories
            .AnyAsync(
                item =>
                    item.Id != categoryId &&
                    item.Name.ToLower() == normalizedName,
                cancellationToken);

        if (duplicateExists)
        {
            throw new InvalidOperationException(
                "A category with this name already exists.");
        }

        category.Name = name;
        category.Description =
            dto.Description?.Trim() ?? string.Empty;
        category.DefaultTeamId = dto.DefaultTeamId;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetCategoryDtoAsync(
            categoryId,
            cancellationToken);
    }

    public async Task<CategoryAdminDto?> SetDefaultTeamAsync(
        Guid categoryId,
        Guid? teamId,
        CancellationToken cancellationToken = default)
    {
        var category = await _context.TicketCategories
            .SingleOrDefaultAsync(
                item => item.Id == categoryId && item.IsActive,
                cancellationToken);

        if (category is null)
            return null;

        await ValidateTeamAsync(teamId, cancellationToken);

        category.DefaultTeamId = teamId;
        await _context.SaveChangesAsync(cancellationToken);

        return await GetCategoryDtoAsync(
            categoryId,
            cancellationToken);
    }

    public async Task<bool> DeleteCategoryAsync(
        Guid categoryId,
        CancellationToken cancellationToken = default)
    {
        var category = await _context.TicketCategories
            .Include(item => item.Subcategories)
            .SingleOrDefaultAsync(
                item => item.Id == categoryId && item.IsActive,
                cancellationToken);

        if (category is null)
            return false;

        // Soft-delete keeps historical ticket relations valid.
        category.IsActive = false;
        category.DefaultTeamId = null;

        foreach (var subcategory in category.Subcategories)
            subcategory.IsActive = false;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<CategoryAdminDto?> CreateSubcategoryAsync(
        Guid categoryId,
        SubcategoryUpsertDto dto,
        CancellationToken cancellationToken = default)
    {
        ValidateSubcategoryDto(dto);

        var category = await _context.TicketCategories
            .Include(item => item.Subcategories)
            .SingleOrDefaultAsync(
                item => item.Id == categoryId && item.IsActive,
                cancellationToken);

        if (category is null)
            return null;

        var name = dto.Name.Trim();
        var existingSubcategory = category.Subcategories
            .OrderByDescending(item => item.IsActive)
            .FirstOrDefault(item => string.Equals(
                item.Name,
                name,
                StringComparison.OrdinalIgnoreCase));

        if (existingSubcategory?.IsActive == true)
        {
            throw new InvalidOperationException(
                "An active subcategory with this name already exists in the category.");
        }

        if (existingSubcategory is not null)
        {
            existingSubcategory.Name = name;
            existingSubcategory.Description =
                dto.Description?.Trim() ?? string.Empty;
            existingSubcategory.IsActive = true;
        }
        else
        {
            category.Subcategories.Add(new TicketSubCategory
            {
                CategoryId = categoryId,
                Name = name,
                Description = dto.Description?.Trim() ?? string.Empty,
                IsActive = true
            });
        }

        await _context.SaveChangesAsync(cancellationToken);

        return await GetCategoryDtoAsync(
            categoryId,
            cancellationToken);
    }

    public async Task<CategoryAdminDto?> UpdateSubcategoryAsync(
        Guid categoryId,
        Guid subcategoryId,
        SubcategoryUpsertDto dto,
        CancellationToken cancellationToken = default)
    {
        ValidateSubcategoryDto(dto);

        var subcategory = await _context.TicketSubCategories
            .SingleOrDefaultAsync(
                item =>
                    item.Id == subcategoryId &&
                    item.CategoryId == categoryId &&
                    item.IsActive &&
                    item.Category.IsActive,
                cancellationToken);

        if (subcategory is null)
            return null;

        var name = dto.Name.Trim();
        var normalizedName = name.ToLower();
        var duplicateExists = await _context.TicketSubCategories
            .AnyAsync(
                item =>
                    item.Id != subcategoryId &&
                    item.CategoryId == categoryId &&
                    item.IsActive &&
                    item.Name.ToLower() == normalizedName,
                cancellationToken);

        if (duplicateExists)
        {
            throw new InvalidOperationException(
                "An active subcategory with this name already exists in the category.");
        }

        subcategory.Name = name;
        subcategory.Description =
            dto.Description?.Trim() ?? string.Empty;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetCategoryDtoAsync(
            categoryId,
            cancellationToken);
    }

    public async Task<CategoryAdminDto?> DeleteSubcategoryAsync(
        Guid categoryId,
        Guid subcategoryId,
        CancellationToken cancellationToken = default)
    {
        var subcategory = await _context.TicketSubCategories
            .SingleOrDefaultAsync(
                item =>
                    item.Id == subcategoryId &&
                    item.CategoryId == categoryId &&
                    item.IsActive &&
                    item.Category.IsActive,
                cancellationToken);

        if (subcategory is null)
            return null;

        // Soft-delete keeps historical ticket relations valid.
        subcategory.IsActive = false;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetCategoryDtoAsync(
            categoryId,
            cancellationToken);
    }

    private IQueryable<CategoryAdminDto> CategoryQuery()
    {
        return _context.TicketCategories
            .AsNoTracking()
            .Select(category => new CategoryAdminDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                IsActive = category.IsActive,
                DefaultTeamId = category.DefaultTeamId,
                DefaultTeamName = category.DefaultTeam != null
                    ? category.DefaultTeam.Name
                    : null,
                SubcategoryCount = category.Subcategories.Count(
                    subcategory => subcategory.IsActive),
                Subcategories = category.Subcategories
                    .Where(subcategory => subcategory.IsActive)
                    .OrderBy(subcategory => subcategory.Name)
                    .Select(subcategory => new SubcategoryAdminDto
                    {
                        Id = subcategory.Id,
                        CategoryId = subcategory.CategoryId,
                        Name = subcategory.Name,
                        Description = subcategory.Description,
                        IsActive = subcategory.IsActive
                    })
                    .ToList()
            });
    }

    private async Task<CategoryAdminDto> GetCategoryDtoAsync(
        Guid categoryId,
        CancellationToken cancellationToken)
    {
        return await CategoryQuery().SingleAsync(
            category => category.Id == categoryId,
            cancellationToken);
    }

    private async Task ValidateDtoAsync(
        CategoryUpsertDto dto,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Category name is required.");

        if (dto.Name.Trim().Length > 100)
        {
            throw new ArgumentException(
                "Category name cannot exceed 100 characters.");
        }

        if ((dto.Description?.Trim().Length ?? 0) > 500)
        {
            throw new ArgumentException(
                "Category description cannot exceed 500 characters.");
        }

        await ValidateTeamAsync(
            dto.DefaultTeamId,
            cancellationToken);
    }

    private static void ValidateSubcategoryDto(
        SubcategoryUpsertDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Subcategory name is required.");

        if (dto.Name.Trim().Length > 100)
        {
            throw new ArgumentException(
                "Subcategory name cannot exceed 100 characters.");
        }

        if ((dto.Description?.Trim().Length ?? 0) > 500)
        {
            throw new ArgumentException(
                "Subcategory description cannot exceed 500 characters.");
        }
    }

    private async Task ValidateTeamAsync(
        Guid? teamId,
        CancellationToken cancellationToken)
    {
        if (!teamId.HasValue)
            return;

        var activeTeamExists = await _context.Teams.AnyAsync(
            team => team.Id == teamId.Value && team.IsActive,
            cancellationToken);

        if (!activeTeamExists)
        {
            throw new ArgumentException(
                "The selected support team was not found or is inactive.");
        }
    }
}
