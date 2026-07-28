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
    public async Task<IActionResult> Create(Guid ticketId, [FromForm] TicketAttachmentCreateDto dto, CancellationToken ct)
    { var items = await _service.AddAttachmentAsync(ticketId, dto, UserId, ct); return items.Count == 0 ? BadRequest(new { message = "Ticket or valid file was not found." }) : Ok(items); }

    [HttpPatch("{attachmentId:guid}")]
    public async Task<IActionResult> Update(Guid ticketId, Guid attachmentId, [FromBody] TicketAttachmentUpdateDto dto, CancellationToken ct)
    { var item = await _service.UpdateAttachmentAsync(ticketId, attachmentId, dto, UserId, CanManageAll, ct); return item is null ? NotFound() : Ok(item); }

    [HttpDelete("{attachmentId:guid}")]
    public async Task<IActionResult> Delete(Guid ticketId, Guid attachmentId, CancellationToken ct) =>
        await _service.DeleteAttachmentAsync(ticketId, attachmentId, UserId, CanManageAll, ct) ? NoContent() : NotFound();
}
