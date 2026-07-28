using System.Security.Claims;
using backend.DTO.Common;
using backend.DTO.Ticket;
using backend.Services.Ticket;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/tickets")]
public class TicketController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }


    [HttpGet]
    [ProducesResponseType(typeof(PagedResultDto<TicketListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTickets([FromQuery] TicketFilterDto filter, CancellationToken cancellationToken)
    {
        var result = await _ticketService.GetTicketAsync(filter, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TicketDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTicketById(Guid id, CancellationToken cancellationToken)
    {
        var ticket = await _ticketService.GetTicketByAsync(id, cancellationToken);
        if (ticket == null)
            return NotFound(new { message = "Ticket not found." });

        return Ok(ticket);
    }

    [HttpPost]
    [ProducesResponseType(typeof(TicketResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateTicket([FromBody] TicketCreateDto dto, CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == Guid.Empty)
            return Unauthorized(new { message = "Invalid user identity." });

        var createdTicket = await _ticketService.CreateTicketAsync(dto, currentUserId, cancellationToken);
        
        return CreatedAtAction(
            nameof(GetTicketById), 
            new { id = createdTicket.Id }, 
            createdTicket
        );
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(TicketResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTicket(Guid id, [FromBody] TicketUpdateDto dto, CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var updatedTicket = await _ticketService.UpdateTicketAsync(id, dto, currentUserId, cancellationToken);
        
        if (updatedTicket == null)
            return NotFound(new { message = "Ticket to update was not found." });

        return Ok(updatedTicket);
    }

    [HttpPost("{id:guid}/assign")]
    [ProducesResponseType(typeof(TicketAssignmentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignTicket(Guid id, [FromBody] TicketAssignmentDto dto, CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _ticketService.AssignTicketAsync(id, dto, currentUserId, cancellationToken);
        
        if (result == null)
            return NotFound(new { message = "Ticket or assignee not found." });

        return Ok(result);
    }

    [HttpDelete("{id:guid}/assign")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnassignTicket(Guid id, [FromBody] TicketAssignmentDto dto, CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var success = await _ticketService.UnassignTicketAsync(id, dto, currentUserId, cancellationToken);
        
        if (!success)
            return NotFound(new { message = "Ticket assignment to remove was not found." });

        return Ok(new { message = "Assignment succesffuly removed." });
    }

    [HttpPost("{id:guid}/comments")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(TicketCommentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddComment(Guid id, [FromForm] TicketCommentCreateDto dto, CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var comment = await _ticketService.AddCommentAsync(id, dto, currentUserId, cancellationToken);
        
        if (comment == null)
            return NotFound(new { message = "Ticket to add comment to was not found." });

        return CreatedAtAction(nameof(GetTicketById), new { id }, comment);
    }

    [HttpPost("{id:guid}/attachments")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(IReadOnlyCollection<TicketAttachmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddAttachment(Guid id, [FromForm] TicketAttachmentCreateDto dto, CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var attachments = await _ticketService.AddAttachmentAsync(id, dto, currentUserId, cancellationToken);
        
        return Ok(attachments);
    }

    [HttpPost("{id:guid}/resolve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResolveTicket(Guid id, [FromBody] TicketResolveDto dto, CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var success = await _ticketService.ResolveTicketAsync(id, dto, currentUserId, cancellationToken);
        
        if (!success)
            return NotFound(new { message = "Ticket not found or could not be resolved.." });

        return Ok(new { message = "Ticket succesfully resolved.." });
    }

    [HttpGet("{id:guid}/history")]
    [ProducesResponseType(typeof(IReadOnlyCollection<TicketHistoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistory(Guid id, CancellationToken cancellationToken)
    {
        var history = await _ticketService.GetHistoryAsync(id, cancellationToken);
        return Ok(history);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTicket(Guid id, CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var success = await _ticketService.DeleteTicketAsync(id, currentUserId, cancellationToken);
        
        if (!success)
            return NotFound(new { message = "Ticket to delete was not found." });

        return Ok(new { message = "Ticket succesfully deleted." });
    }
}