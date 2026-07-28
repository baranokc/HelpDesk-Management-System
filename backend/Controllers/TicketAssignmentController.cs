using backend.DTO.Ticket;
using backend.Services.TicketAssignment;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using backend.Entities;
using System.Security.Cryptography.X509Certificates;
using FluentValidation.Validators;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TicketAssignmentController : ControllerBase
{
    private readonly ITicketAssignmentService _assignmentService;

    public TicketAssignmentController(ITicketAssignmentService assignmentService)
    {
        _assignmentService = assignmentService;
    }
    [HttpPost]
    public async Task<IActionResult> AssignTicket([FromBody] TicketAssignRequestDto request)
    {
        var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(currentUserIdClaim))
            return Unauthorized(new { message = "You need to log in." });
        Guid currentUserId = Guid.Parse(currentUserIdClaim);

        var createDto = new TicketAssignmentCreateDto
        {
            TicketId = request.TicketId,
            AssignedById = currentUserId,
            Note = request.Note
        };
        var assignmentDto = new TicketAssignmentDto
        {
            TeamId = request.TeamId,
            TeamMemberId = request.TeamMemberId,
        };
        var result = await _assignmentService.AssignTicketAsync(createDto, assignmentDto);

        if (result is null)
            return BadRequest(new { message = "Assignment failed. Please check yoru Ticket, Team or Member IDs." });
        return Ok(result); }

        
}
        
    