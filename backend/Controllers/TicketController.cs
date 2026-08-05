using System.Security.Claims;
using backend.Constants;
using backend.DTO.Ticket;
using backend.Services.Ticket;
using backend.Services.TicketAssignment;
using backend.Services.TicketHistory;
using backend.Services.TicketResolution;
using backend.Services.TicketUnassignment;
using backend.Services.TicketAttachment;
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
        private string GetCurrentUserRole()
    {
        return User.FindFirstValue(ClaimTypes.Role)
               ?? string.Empty;
    }

    [HttpGet]
    [Authorize(Roles = $"{Roles.Admin},{Roles.SupportAgent},{Roles.TeamLeader},{Roles.User}")]
    [ProducesResponseType(typeof(TicketPagedResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTickets(
        [FromQuery] TicketFilterDto filter,
        CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var currentUserRole = GetCurrentUserRole();

        if (currentUserId == Guid.Empty ||
            string.IsNullOrWhiteSpace(currentUserRole))
        {
            return Unauthorized(new
            {
                message = "Invalid user identity."
            });
        }

        var result = await _ticketService.GetTicketAsync(
            filter,
            currentUserId,
            currentUserRole,
            cancellationToken);

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.SupportAgent},{Roles.TeamLeader},{Roles.User}")]
    [ProducesResponseType(typeof(TicketDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTicketById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var currentUserRole = GetCurrentUserRole();

        if (currentUserId == Guid.Empty ||
            string.IsNullOrWhiteSpace(currentUserRole))
        {
            return Unauthorized(new
            {
                message = "Invalid user identity."
            });
        }

        var ticket = await _ticketService.GetTicketByAsync(
            id,
            currentUserId,
            currentUserRole,
            cancellationToken);

        if (ticket is null)
            return NotFound(new { message = "Ticket not found." });

        return Ok(ticket);
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.Admin},{Roles.SupportAgent},{Roles.User}")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(TicketResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateTicket(
        [FromForm] TicketCreateDto dto,
        CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == Guid.Empty)
            return Unauthorized(new { message = "Invalid user identity." });

        try
        {
            var createdTicket = await _ticketService.CreateTicketAsync(
                dto,
                currentUserId,
                cancellationToken);

            return CreatedAtAction(
                nameof(GetTicketById),
                new { id = createdTicket.Id },
                createdTicket);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.SupportAgent},{Roles.TeamLeader},{Roles.User}")]
    [ProducesResponseType(typeof(TicketResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTicket(
        Guid id,
        [FromBody] TicketUpdateDto dto,
        CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var currentUserRole = GetCurrentUserRole();

        if (currentUserId == Guid.Empty ||
            string.IsNullOrWhiteSpace(currentUserRole))
        {
            return Unauthorized(new
            {
                message = "Invalid user identity."
            });
        }

        try
        {
            var updatedTicket = await _ticketService.UpdateTicketAsync(
                id,
                dto,
                currentUserId,
                currentUserRole,
                cancellationToken);

            if (updatedTicket is null)
            {
                return NotFound(new
                {
                    message = "Ticket to update was not found."
                });
            }

            return Ok(updatedTicket);
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = exception.Message });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
    }

    [HttpPost("{id:guid}/assign")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.TeamLeader}")]
    [ProducesResponseType(typeof(TicketAssignmentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignTicket(
        Guid id,
        [FromBody] TicketAssignmentDto dto,
        CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var currentUserRole = GetCurrentUserRole();

        if (currentUserId == Guid.Empty ||
            string.IsNullOrWhiteSpace(currentUserRole))
        {
            return Unauthorized(new
            {
                message = "Invalid user identity."
            });
        }

        if (!await _ticketService.CanAccessTicketAsync(
                id,
                currentUserId,
                currentUserRole,
                cancellationToken))
        {
            return NotFound(new { message = "Ticket not found." });
        }

        var createDto = new TicketAssignmentCreateDto
        {
            TicketId = id,
            AssignedById = currentUserId,
            Note = dto.Reason
        };

        try
        {
            var result = await _ticketAssignmentService
                .AssignTicketAsync(
                    createDto,
                    dto,
                    currentUserRole,
                    cancellationToken);

            if (result is null)
            {
                return NotFound(new
                {
                    message =
                        "Ticket, team, or team member not found."
                });
            }

            return Ok(result);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = exception.Message });
        }
    }

    [HttpDelete("{id:guid}/assign")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.TeamLeader}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnassignTicket(
        Guid id,
        [FromBody] TicketUnassignmentDto dto,
        CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var currentUserRole = GetCurrentUserRole();

        if (currentUserId == Guid.Empty ||
            string.IsNullOrWhiteSpace(currentUserRole))
        {
            return Unauthorized(new { message = "Invalid user identity." });
        }

        if (!await _ticketService.CanAccessTicketAsync(
                id,
                currentUserId,
                currentUserRole,
                cancellationToken))
        {
            return NotFound(new { message = "Ticket not found." });
        }

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
    [Authorize(Roles = $"{Roles.Admin},{Roles.SupportAgent},{Roles.TeamLeader}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResolveTicket(
        Guid id,
        [FromBody] TicketResolveDto dto,
        CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var currentUserRole = GetCurrentUserRole();

        if (currentUserId == Guid.Empty ||
            string.IsNullOrWhiteSpace(currentUserRole))
        {
            return Unauthorized(new
            {
                message = "Invalid user identity."
            });
        }

        if (!await _ticketService.CanProcessTicketAsync(
                id,
                currentUserId,
                currentUserRole,
                cancellationToken))
        {
            return NotFound(new { message = "Ticket not found." });
        }

        try
        {
            var success =
                await _ticketResolutionService.ResolveTicketAsync(
                    id,
                    dto,
                    currentUserId,
                    cancellationToken);

            if (!success)
            {
                return NotFound(new
                {
                    message =
                        "Ticket not found or could not be resolved."
                });
            }

            return Ok(new
            {
                message = "Ticket successfully resolved."
            });
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
    }

    [HttpGet("{id:guid}/history")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.SupportAgent},{Roles.TeamLeader},{Roles.User}")]
    [ProducesResponseType(typeof(IReadOnlyCollection<TicketHistoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistory(
        Guid id,
        CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var currentUserRole = GetCurrentUserRole();

        if (currentUserId == Guid.Empty ||
            string.IsNullOrWhiteSpace(currentUserRole))
        {
            return Unauthorized(new { message = "Invalid user identity." });
        }

        if (!await _ticketService.CanAccessTicketAsync(
                id,
                currentUserId,
                currentUserRole,
                cancellationToken))
        {
            return NotFound(new { message = "Ticket not found." });
        }

        var history = await _ticketHistoryService.GetHistoryAsync(
            id,
            currentUserRole != Roles.User,
            cancellationToken);

        return Ok(history);
    }
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.SupportAgent},{Roles.TeamLeader},{Roles.User}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteTicket(
        Guid id,
        CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var currentUserRole = GetCurrentUserRole();

        if (currentUserId == Guid.Empty ||
            string.IsNullOrWhiteSpace(currentUserRole))
        {
            return Unauthorized(new { message = "Invalid user identity." });
        }

        try
        {
            var success = await _ticketService.DeleteTicketAsync(
                id,
                currentUserId,
                currentUserRole,
                cancellationToken);

            if (!success)
            {
                return NotFound(new
                {
                    message = "Ticket to delete was not found."
                });
            }

            return Ok(new { message = "Ticket successfully deleted." });
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = exception.Message });
        }
    }
}
