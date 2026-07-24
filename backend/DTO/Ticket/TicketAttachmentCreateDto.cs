namespace backend.DTO.Ticket;
public class TicketAttachmentCreateDto
{
    public List<IFormFile> Files {get; set; } = [];
    public Guid? CommentId {get; set; }
    public string? Description {get; set; }
}