using System.Security.Claims;
using backend.Constants;
using backend.DTO.Ticket;
using backend.Services.TicketComment;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/tickets/{ticketId:guid}/comments")]
public class TicketCommentController : ControllerBase
{
    private readonly ITicketCommentService _service;
    public TicketCommentController(ITicketCommentService service) => _service = service;
    private Guid UserId => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var id) ? id : Guid.Empty;
    private bool CanManageAll => User.IsInRole(Roles.Admin) || User.IsInRole(Roles.SupportAgent);

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid ticketId, CancellationToken ct) => Ok(await _service.GetCommentsAsync(ticketId, CanManageAll, ct));

    [HttpGet("{commentId:guid}")]
    public async Task<IActionResult> GetById(Guid ticketId, Guid commentId, CancellationToken ct)
    { var item = await _service.GetCommentByIdAsync(ticketId, commentId, CanManageAll, ct); return item is null ? NotFound() : Ok(item); }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create(Guid ticketId, [FromForm] TicketCommentCreateDto dto, CancellationToken ct)
    { var item = await _service.AddCommentAsync(ticketId, dto, UserId, ct); return item is null ? NotFound() : CreatedAtAction(nameof(GetById), new { ticketId, commentId = item.Id }, item); }

    [HttpPut("{commentId:guid}")]
    public async Task<IActionResult> Update(Guid ticketId, Guid commentId, [FromBody] TicketCommentUpdateDto dto, CancellationToken ct)
    { var item = await _service.UpdateCommentAsync(ticketId, commentId, dto, UserId, CanManageAll, ct); return item is null ? NotFound() : Ok(item); }

    [HttpDelete("{commentId:guid}")]
    public async Task<IActionResult> Delete(Guid ticketId, Guid commentId, CancellationToken ct) =>
        await _service.DeleteCommentAsync(ticketId, commentId, UserId, CanManageAll, ct) ? NoContent() : NotFound();
}
