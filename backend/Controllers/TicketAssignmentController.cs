using backend.DTO.Ticket;
using backend.Constants;
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
    [Authorize(Roles = $"{Roles.Admin},{Roles.SupportAgent}")]
    [ProducesResponseType(typeof(TicketAssignmentResponseDto),StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AssignTicket(
        [FromBody] TicketAssignRequestDto request)
    {
        var currentUserIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!Guid.TryParse(currentUserIdClaim, out var currentUserId))
        {
            return Unauthorized(new
            {
                message = "Invalid user identity."
            });
        }

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
            Reason = request.Note
        };

        try
        {
            var result = await _assignmentService
                .AssignTicketAsync(createDto, assignmentDto);

            if (result is null)
            {
                return BadRequest(new
                {
                    message = "Ticket assignment failed."
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
    }

        
}
        
    