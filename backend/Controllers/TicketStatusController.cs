using System.Data;
using backend.DTO.Ticket;
using backend.Services.TicketStatus;
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

    public TicketStatusController(ITicketStatusService statusService)
    {
        _statusService = statusService;
    }

    [HttpPost("update")]
    public async Task<IActionResult> UpdateStatus([FromBody] TicketStatusUpdateDto request)
    {
        var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(currentUserIdClaim))
            return Unauthorized(new { message = "You need to log in." });
        Guid currentUserId = Guid.Parse(currentUserIdClaim);
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
    public async Task<IActionResult> GetTicketHistory(Guid ticketId)
    {
        var history = await _statusService.GetTicketHistoryDtosAsync(ticketId);
        return Ok(history);
    }

}