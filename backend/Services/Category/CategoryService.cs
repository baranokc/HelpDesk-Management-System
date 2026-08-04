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
                    subcategory => subcategory.IsActive)
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
