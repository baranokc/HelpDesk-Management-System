using backend.Constants;
using backend.DTO.Category;
using backend.Services.Category;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/categories")]
[Authorize(Roles = Roles.Admin)]
public class CategoryController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoryController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    public async Task<ActionResult<
        IReadOnlyCollection<CategoryAdminDto>>> GetAllCategories(
            CancellationToken cancellationToken)
    {
        return Ok(
            await _categoryService.GetAllCategoriesAsync(
                cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CategoryAdminDto>> GetCategoryById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var category = await _categoryService.GetCategoryByIdAsync(
            id,
            cancellationToken);

        if (category is null)
            return NotFound(new { message = "Category not found." });

        return Ok(category);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryAdminDto>> CreateCategory(
        [FromBody] CategoryUpsertDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var category = await _categoryService.CreateCategoryAsync(
                dto,
                cancellationToken);

            return CreatedAtAction(
                nameof(GetCategoryById),
                new { id = category.Id },
                category);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CategoryAdminDto>> UpdateCategory(
        Guid id,
        [FromBody] CategoryUpsertDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var category = await _categoryService.UpdateCategoryAsync(
                id,
                dto,
                cancellationToken);

            if (category is null)
                return NotFound(new { message = "Category not found." });

            return Ok(category);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    [HttpPut("{id:guid}/team")]
    public async Task<ActionResult<CategoryAdminDto>> SetDefaultTeam(
        Guid id,
        [FromBody] CategoryTeamAssignmentDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var category = await _categoryService.SetDefaultTeamAsync(
                id,
                dto.TeamId,
                cancellationToken);

            if (category is null)
                return NotFound(new { message = "Category not found." });

            return Ok(category);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCategory(
        Guid id,
        CancellationToken cancellationToken)
    {
        var deleted = await _categoryService.DeleteCategoryAsync(
            id,
            cancellationToken);

        if (!deleted)
            return NotFound(new { message = "Category not found." });

        return NoContent();
    }

    [HttpPost("{categoryId:guid}/subcategories")]
    public async Task<ActionResult<CategoryAdminDto>> CreateSubcategory(
        Guid categoryId,
        [FromBody] SubcategoryUpsertDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var category = await _categoryService.CreateSubcategoryAsync(
                categoryId,
                dto,
                cancellationToken);

            if (category is null)
                return NotFound(new { message = "Category not found." });

            return Ok(category);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(new
            {
                message = "The subcategory was changed by another request. Refresh the category list and try again."
            });
        }
    }

    [HttpPut("{categoryId:guid}/subcategories/{subcategoryId:guid}")]
    public async Task<ActionResult<CategoryAdminDto>> UpdateSubcategory(
        Guid categoryId,
        Guid subcategoryId,
        [FromBody] SubcategoryUpsertDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var category = await _categoryService.UpdateSubcategoryAsync(
                categoryId,
                subcategoryId,
                dto,
                cancellationToken);

            if (category is null)
            {
                return NotFound(new
                {
                    message = "Category or active subcategory not found."
                });
            }

            return Ok(category);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    [HttpDelete("{categoryId:guid}/subcategories/{subcategoryId:guid}")]
    public async Task<ActionResult<CategoryAdminDto>> DeleteSubcategory(
        Guid categoryId,
        Guid subcategoryId,
        CancellationToken cancellationToken)
    {
        var category = await _categoryService.DeleteSubcategoryAsync(
            categoryId,
            subcategoryId,
            cancellationToken);

        if (category is null)
        {
            return NotFound(new
            {
                message = "Category or active subcategory not found."
            });
        }

        return Ok(category);
    }
}