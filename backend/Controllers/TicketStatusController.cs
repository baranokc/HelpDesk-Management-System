using System.Data;
using backend.DTO.Ticket;
using backend.Services.TicketStatus;
using backend.Services.Ticket;
using backend.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TicketStatusController : ControllerBase
{
    private readonly ITicketStatusService _statusService;
    private readonly ITicketService _ticketService;

    public TicketStatusController(
        ITicketStatusService statusService,
        ITicketService ticketService)
    {
        _statusService = statusService;
        _ticketService = ticketService;
    }

    [HttpPost("update")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.SupportAgent},{Roles.User}")]
    public async Task<IActionResult> UpdateStatus(
        [FromBody] TicketStatusUpdateDto request,
        CancellationToken cancellationToken)
    {
        var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                ?? User.FindFirst("sub")?.Value;
        if (!Guid.TryParse(currentUserIdClaim, out var currentUserId))
            return Unauthorized(new { message = "You need to log in." });

        var currentUserRole =
            User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

        if (!await _ticketService.CanAccessTicketAsync(
                request.TicketId,
                currentUserId,
                currentUserRole,
                cancellationToken))
        {
            return NotFound(new { message = "Ticket not found." });
        }

        var success = await _statusService.UpdateTicketStatusAsync(
            request.TicketId,
            request.StatusId,
            currentUserId,
            request.Reason
        );
        if (!success)
            return BadRequest(new { message = "Status update failed. Please check your ticket or Status ID." });

        return Ok(new { message = "Ticket status has been successfully updated." });
    }

    [HttpGet("history/{ticketId}")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.SupportAgent},{Roles.User}")]
    public async Task<IActionResult> GetTicketHistory(
        Guid ticketId,
        CancellationToken cancellationToken)
    {
        var currentUserIdClaim =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (!Guid.TryParse(currentUserIdClaim, out var currentUserId))
            return Unauthorized(new { message = "You need to log in." });

        var currentUserRole =
            User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

        if (!await _ticketService.CanAccessTicketAsync(
                ticketId,
                currentUserId,
                currentUserRole,
                cancellationToken))
        {
            return NotFound(new { message = "Ticket not found." });
        }

        var history = await _statusService.GetTicketHistoryDtosAsync(ticketId);
        return Ok(history);
    }

}
