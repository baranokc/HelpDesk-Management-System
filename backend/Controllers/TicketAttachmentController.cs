using System.Security.Claims;
using backend.Constants;
using backend.DTO.Ticket;
using backend.Services.TicketAttachment;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/tickets/{ticketId:guid}/attachments")]
public class TicketAttachmentController : ControllerBase
{
    private readonly ITicketAttachmentService _service;
    public TicketAttachmentController(ITicketAttachmentService service) => _service = service;
    private Guid UserId => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var id) ? id : Guid.Empty;
    private bool CanManageAll => User.IsInRole(Roles.Admin) || User.IsInRole(Roles.SupportAgent);

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid ticketId, [FromQuery] Guid? commentId, CancellationToken ct) => Ok(await _service.GetAttachmentsAsync(ticketId, commentId, ct));

    [HttpGet("{attachmentId:guid}")]
    public async Task<IActionResult> GetById(Guid ticketId, Guid attachmentId, CancellationToken ct)
    { var item = await _service.GetAttachmentByIdAsync(ticketId, attachmentId, ct); return item is null ? NotFound() : Ok(item); }

    [HttpGet("{attachmentId:guid}/download")]
    public async Task<IActionResult> Download(Guid ticketId, Guid attachmentId, CancellationToken ct)
    { var item = await _service.GetDownloadAsync(ticketId, attachmentId, ct); return item is null ? NotFound() : PhysicalFile(item.PhysicalPath, item.ContentType, item.FileName); }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create(
        Guid ticketId,
        [FromForm] TicketAttachmentCreateDto dto,
        CancellationToken ct)
    {
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
    public async Task<IActionResult> Update(Guid ticketId, Guid attachmentId, [FromBody] TicketAttachmentUpdateDto dto, CancellationToken ct)
    { var item = await _service.UpdateAttachmentAsync(ticketId, attachmentId, dto, UserId, CanManageAll, ct); return item is null ? NotFound() : Ok(item); }

    [HttpDelete("{attachmentId:guid}")]
    public async Task<IActionResult> Delete(
        Guid ticketId,
        Guid attachmentId,
        CancellationToken ct)
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
}
