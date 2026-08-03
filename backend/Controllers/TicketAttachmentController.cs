using System.Security.Claims;
using backend.Constants;
using backend.DTO.Ticket;
using backend.Services.TicketAttachment;
using backend.Services.Ticket;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/tickets/{ticketId:guid}/attachments")]
public class TicketAttachmentController : ControllerBase
{
    private readonly ITicketAttachmentService _service;
    private readonly ITicketService _ticketService;

    public TicketAttachmentController(
        ITicketAttachmentService service,
        ITicketService ticketService)
    {
        _service = service;
        _ticketService = ticketService;
    }

    private Guid UserId => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var id) ? id : Guid.Empty;
    private string UserRole => User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
    private bool CanManageAll => User.IsInRole(Roles.Admin) || User.IsInRole(Roles.SupportAgent);

    [HttpGet]
    public async Task<IActionResult> GetAll(
        Guid ticketId,
        [FromQuery] Guid? commentId,
        CancellationToken ct)
    {
        if (!await CanAccessTicketAsync(ticketId, ct))
            return NotFound(new { message = "Ticket not found." });

        return Ok(await _service.GetAttachmentsAsync(
            ticketId,
            commentId,
            CanManageAll,
            ct));
    }

    [HttpGet("{attachmentId:guid}")]
    public async Task<IActionResult> GetById(
        Guid ticketId,
        Guid attachmentId,
        CancellationToken ct)
    {
        if (!await CanAccessTicketAsync(ticketId, ct))
            return NotFound(new { message = "Ticket not found." });

        var item = await _service.GetAttachmentByIdAsync(
            ticketId,
            attachmentId,
            CanManageAll,
            ct);

        return item is null ? NotFound() : Ok(item);
    }

    [HttpGet("{attachmentId:guid}/download")]
    public async Task<IActionResult> Download(
        Guid ticketId,
        Guid attachmentId,
        CancellationToken ct)
    {
        if (!await CanAccessTicketAsync(ticketId, ct))
            return NotFound(new { message = "Ticket not found." });

        var item = await _service.GetDownloadAsync(
            ticketId,
            attachmentId,
            CanManageAll,
            ct);

        return item is null
            ? NotFound()
            : PhysicalFile(
                item.PhysicalPath,
                item.ContentType,
                item.FileName);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create(
        Guid ticketId,
        [FromForm] TicketAttachmentCreateDto dto,
        CancellationToken ct)
    {
        if (!await CanAccessTicketAsync(ticketId, ct))
            return NotFound(new { message = "Ticket not found." });

        try
        {
            var items = await _service.AddAttachmentAsync(
                ticketId,
                dto,
                UserId,
                ct);

            if (items.Count == 0)
            {
                return BadRequest(new
                {
                    message = "Ticket or valid file was not found."
                });
            }

            return Ok(items);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
    }

    [HttpPatch("{attachmentId:guid}")]
    public async Task<IActionResult> Update(
        Guid ticketId,
        Guid attachmentId,
        [FromBody] TicketAttachmentUpdateDto dto,
        CancellationToken ct)
    {
        if (!await CanAccessTicketAsync(ticketId, ct))
            return NotFound(new { message = "Ticket not found." });

        try
        {
            var item = await _service.UpdateAttachmentAsync(
                ticketId,
                attachmentId,
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

    [HttpDelete("{attachmentId:guid}")]
    public async Task<IActionResult> Delete(
        Guid ticketId,
        Guid attachmentId,
        CancellationToken ct)
    {
        if (!await CanAccessTicketAsync(ticketId, ct))
            return NotFound(new { message = "Ticket not found." });

        try
        {
            var deleted = await _service.DeleteAttachmentAsync(
                ticketId,
                attachmentId,
                UserId,
                CanManageAll,
                ct);

            if (!deleted)
            {
                return NotFound(new
                {
                    message =
                        "Attachment was not found or does not belong to the specified ticket."
                });
            }

            return NoContent();
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = exception.Message });
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
