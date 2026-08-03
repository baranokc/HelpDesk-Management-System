using System.Security.Claims;
using backend.Constants;
using backend.DTO.Ticket;
using backend.Services.TicketComment;
using backend.Services.Ticket;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/tickets/{ticketId:guid}/comments")]
public class TicketCommentController : ControllerBase
{
    private readonly ITicketCommentService _service;
    private readonly ITicketService _ticketService;

    public TicketCommentController(
        ITicketCommentService service,
        ITicketService ticketService)
    {
        _service = service;
        _ticketService = ticketService;
    }

    private Guid UserId => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var id) ? id : Guid.Empty;
    private string UserRole => User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
    private bool CanManageAll => User.IsInRole(Roles.Admin)|| User.IsInRole(Roles.TeamLeader) || User.IsInRole(Roles.SupportAgent);
    private bool CanViewInternal => CanManageAll || User.IsInRole(Roles.TeamLeader);

    [HttpGet]
    public async Task<IActionResult> GetAll(
        Guid ticketId,
        CancellationToken ct)
    {
        if (!await CanAccessTicketAsync(ticketId, ct))
            return NotFound(new { message = "Ticket not found." });

        return Ok(await _service.GetCommentsAsync(
            ticketId,
            CanViewInternal,
            ct));
    }

    [HttpGet("{commentId:guid}")]
    public async Task<IActionResult> GetById(
        Guid ticketId,
        Guid commentId,
        CancellationToken ct)
    {
        if (!await CanAccessTicketAsync(ticketId, ct))
            return NotFound(new { message = "Ticket not found." });

        var item = await _service.GetCommentByIdAsync(
            ticketId,
            commentId,
            CanViewInternal,
            ct);

        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.Admin},{Roles.TeamLeader},{Roles.SupportAgent},{Roles.User}")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create(
        Guid ticketId,
        [FromForm] TicketCommentCreateDto dto,
        CancellationToken ct)
    {
        if (UserId == Guid.Empty)
        {
            return Unauthorized(new
            {
                message = "Invalid user identity."
            });
        }

        if (!await CanAccessTicketAsync(ticketId, ct))
            return NotFound(new { message = "Ticket not found." });

        var item = await _service.AddCommentAsync(
            ticketId,
            dto,
            UserId,
            CanManageAll,
            ct);

        return item is null
            ? NotFound()
            : CreatedAtAction(
                nameof(GetById),
                new
                {
                    ticketId,
                    commentId = item.Id
                },
                item);
    }
    
    [HttpPut("{commentId:guid}")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.TeamLeader},{Roles.SupportAgent},{Roles.User}")]
    public async Task<IActionResult> Update(
        Guid ticketId,
        Guid commentId,
        [FromBody] TicketCommentUpdateDto dto,
        CancellationToken ct)
    {
        if (!await CanAccessTicketAsync(ticketId, ct))
            return NotFound(new { message = "Ticket not found." });

        try
        {
            var item = await _service.UpdateCommentAsync(
                ticketId,
                commentId,
                dto,
                UserId,
                CanManageAll,
                ct);

            return item is null ? NotFound() : Ok(item);
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = exception.Message });
        }
    }

    [HttpDelete("{commentId:guid}")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.TeamLeader},{Roles.SupportAgent},{Roles.User}")]
    public async Task<IActionResult> Delete(
        Guid ticketId,
        Guid commentId,
        CancellationToken ct)
    {
        if (!await CanAccessTicketAsync(ticketId, ct))
            return NotFound(new { message = "Ticket not found." });

        try
        {
            var deleted = await _service.DeleteCommentAsync(
                ticketId,
                commentId,
                UserId,
                CanManageAll,
                ct);

            if (!deleted)
            {
                return NotFound(new
                {
                    message =
                        "Comment was not found or does not belong to the specified ticket."
                });
            }

            return NoContent();
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message = exception.Message
                });
        }
    }

    private Task<bool> CanAccessTicketAsync(
        Guid ticketId,
        CancellationToken cancellationToken)
    {
        if (UserId == Guid.Empty || string.IsNullOrWhiteSpace(UserRole))
            return Task.FromResult(false);

        return _ticketService.CanAccessTicketAsync(
            ticketId,
            UserId,
            UserRole,
            cancellationToken);
    }
}
