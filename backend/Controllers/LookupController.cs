using backend.DTO.Lookup;
using backend.Services.Lookup;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/lookups")]
public class LookupController : ControllerBase
{
    private readonly ILookupService _lookupService;

    public LookupController(ILookupService lookupService)
    {
        _lookupService = lookupService;
    }

    [HttpGet("categories")]
    public async Task<ActionResult<
        IReadOnlyCollection<LookupItemDto<Guid>>>> GetCategories(
        CancellationToken cancellationToken)
    {
        var result = await _lookupService.GetCategoriesAsync(
            cancellationToken);

        return Ok(result);
    }

    [HttpGet("categories/{categoryId:guid}/subcategories")]
    public async Task<ActionResult<
        IReadOnlyCollection<LookupItemDto<Guid>>>> GetSubCategories(
        Guid categoryId,
        CancellationToken cancellationToken)
    {
        if (categoryId == Guid.Empty)
        {
            return BadRequest(new
            {
                message = "Category ID cannot be empty."
            });
        }

        var result = await _lookupService.GetSubCategoriesAsync(
            categoryId,
            cancellationToken);

        return Ok(result);
    }

    [HttpGet("priorities")]
    public async Task<ActionResult<
        IReadOnlyCollection<LookupItemDto<Guid>>>> GetPriorities(
        CancellationToken cancellationToken)
    {
        return Ok(
            await _lookupService.GetPrioritiesAsync(
                cancellationToken));
    }

    [HttpGet("statuses")]
    public async Task<ActionResult<
        IReadOnlyCollection<LookupItemDto<Guid>>>> GetStatuses(
        CancellationToken cancellationToken)
    {
        return Ok(
            await _lookupService.GetStatusesAsync(
                cancellationToken));
    }

    [HttpGet("impact-levels")]
    public async Task<ActionResult<
        IReadOnlyCollection<LookupItemDto<Guid>>>> GetImpactLevels(
        CancellationToken cancellationToken)
    {
        return Ok(
            await _lookupService.GetImpactLevelsAsync(
                cancellationToken));
    }

    [HttpGet("urgency-levels")]
    public async Task<ActionResult<
        IReadOnlyCollection<LookupItemDto<Guid>>>> GetUrgencyLevels(
        CancellationToken cancellationToken)
    {
        return Ok(
            await _lookupService.GetUrgencyLevelsAsync(
                cancellationToken));
    }

    [HttpGet("teams")]
    public async Task<ActionResult<
        IReadOnlyCollection<LookupItemDto<Guid>>>> GetTeams(
        CancellationToken cancellationToken)
    {
        return Ok(
            await _lookupService.GetTeamsAsync(
                cancellationToken));
    }

    [HttpGet("teams/{teamId:guid}/members")]
    public async Task<ActionResult<
        IReadOnlyCollection<TeamMemberLookupDto>>> GetTeamMembers(
        Guid teamId,
        CancellationToken cancellationToken)
    {
        if (teamId == Guid.Empty)
        {
            return BadRequest(new
            {
                message = "Team ID cannot be empty."
            });
        }

        return Ok(
            await _lookupService.GetTeamMembersAsync(
                teamId,
                cancellationToken));
    }

    [HttpGet("departments")]
    public async Task<ActionResult<
        IReadOnlyCollection<LookupItemDto<int>>>> GetDepartments(
        CancellationToken cancellationToken)
    {
        return Ok(
            await _lookupService.GetDepartmentsAsync(
                cancellationToken));
    }

    [HttpGet("roles")]
    public async Task<ActionResult<
        IReadOnlyCollection<LookupItemDto<Guid>>>> GetRoles(
        CancellationToken cancellationToken)
    {
        return Ok(
            await _lookupService.GetRolesAsync(
                cancellationToken));
    }

    [HttpGet("resolution-categories")]
    public async Task<ActionResult<
        IReadOnlyCollection<LookupItemDto<Guid>>>>
        GetResolutionCategories(
            CancellationToken cancellationToken)
    {
        return Ok(
            await _lookupService.GetResolutionCategoriesAsync(
                cancellationToken));
    }

    [HttpGet("request-types")]
    public ActionResult<
        IReadOnlyCollection<EnumLookupItemDto>> GetRequestTypes()
    {
        return Ok(_lookupService.GetRequestTypes());
    }
}