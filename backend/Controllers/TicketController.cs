using System.Security.Claims;
using backend.Constants;
using backend.DTO.Common;
using backend.DTO.Ticket;
using backend.Services.Ticket;
using backend.Services.TicketAssignment;
using backend.Services.TicketHistory;
using backend.Services.TicketResolution;
using backend.Services.TicketUnassignment;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Entities;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/tickets")]
public class TicketController : ControllerBase
{
    private readonly ITicketService _ticketService;
    private readonly ITicketUnassignmentService _ticketUnassignmentService;
    private readonly ITicketResolutionService _ticketResolutionService;
    private readonly ITicketHistoryService _ticketHistoryService;
    private readonly ITicketAssignmentService _ticketAssignmentService;

    public TicketController(
        ITicketService ticketService,
        ITicketAssignmentService ticketAssignmentService,
        ITicketUnassignmentService ticketUnassignmentService,
        ITicketResolutionService ticketResolutionService,
        ITicketHistoryService ticketHistoryService)
    {
        _ticketService = ticketService;
        _ticketAssignmentService = ticketAssignmentService;
        _ticketUnassignmentService = ticketUnassignmentService;
        _ticketResolutionService = ticketResolutionService;
        _ticketHistoryService = ticketHistoryService;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                          ?? User.FindFirst("sub")?.Value;

        return Guid.TryParse(userIdClaim, out var userId)
            ? userId
            : Guid.Empty;
    }

    [HttpGet]
    [Authorize(Roles = $"{Roles.Admin},{Roles.SupportAgent},{Roles.User}")]
    [ProducesResponseType(typeof(PagedResultDto<TicketListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTickets(
        [FromQuery] TicketFilterDto filter,
        CancellationToken cancellationToken)
    {
        var result = await _ticketService.GetTicketAsync(filter, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.SupportAgent},{Roles.User}")]
    [ProducesResponseType(typeof(TicketDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTicketById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var ticket = await _ticketService.GetTicketByAsync(id, cancellationToken);

        if (ticket is null)
            return NotFound(new { message = "Ticket not found." });

        return Ok(ticket);
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.Admin},{Roles.SupportAgent},{Roles.User}")]
    [ProducesResponseType(typeof(TicketResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateTicket(
        [FromBody] TicketCreateDto dto,
        CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == Guid.Empty)
            return Unauthorized(new { message = "Invalid user identity." });

        var createdTicket = await _ticketService.CreateTicketAsync(
            dto,
            currentUserId,
            cancellationToken);

        return CreatedAtAction(
            nameof(GetTicketById),
            new { id = createdTicket.Id },
            createdTicket);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.SupportAgent},{Roles.User}")]
    [ProducesResponseType(typeof(TicketResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTicket(
        Guid id,
        [FromBody] TicketUpdateDto dto,
        CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var updatedTicket = await _ticketService.UpdateTicketAsync(
            id,
            dto,
            currentUserId,
            cancellationToken);

        if (updatedTicket is null)
            return NotFound(new { message = "Ticket to update was not found." });

        return Ok(updatedTicket);
    }

    [HttpPost("{id:guid}/assign")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.SupportAgent}")]
    [ProducesResponseType(typeof(TicketAssignmentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignTicket(
    Guid id, 
    [FromBody] TicketAssignmentDto dto, 
    CancellationToken cancellationToken)
{
    var currentUserId = GetCurrentUserId();
    if (currentUserId == Guid.Empty)
        return Unauthorized(new { message = "Invalid user identity." });

    var createDto = new TicketAssignmentCreateDto
    {
        TicketId = id,
        AssignedById = currentUserId
    };
    var result = await _ticketAssignmentService.AssignTicketAsync(createDto, dto);

    if (result == null)
        return NotFound(new { message = "Ticket, team, or team member not found." });

    return Ok(result);
}

    [HttpDelete("{id:guid}/assign")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.SupportAgent}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnassignTicket(
        Guid id,
        [FromBody] TicketUnassignmentDto dto,
        CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var success = await _ticketUnassignmentService.UnassignTicketAsync(
            id,
            dto,
            currentUserId,
            cancellationToken);

        if (!success)
            return NotFound(new { message = "Ticket assignment to remove was not found." });

        return Ok(new { message = "Assignment successfully removed." });
    }

    [HttpPost("{id:guid}/resolve")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.SupportAgent}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResolveTicket(
        Guid id,
        [FromBody] TicketResolveDto dto,
        CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var success = await _ticketResolutionService.ResolveTicketAsync(
            id,
            dto,
            currentUserId,
            cancellationToken);

        if (!success)
            return NotFound(new { message = "Ticket not found or could not be resolved." });
        return Ok(new { message = "Ticket successfully resolved." });
    }

    [HttpGet("{id:guid}/history")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.SupportAgent},{Roles.User}")]
    [ProducesResponseType(typeof(IReadOnlyCollection<TicketHistoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistory(
        Guid id,
        CancellationToken cancellationToken)
    {
        var history = await _ticketHistoryService.GetHistoryAsync(
            id,
            cancellationToken);

        return Ok(history);
    }
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTicket(
        Guid id,
        CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var success = await _ticketService.DeleteTicketAsync(
            id,
            currentUserId,
            cancellationToken);

        if (!success)
            return NotFound(new { message = "Ticket to delete was not found." });

        return Ok(new { message = "Ticket successfully deleted." });
    }
}
