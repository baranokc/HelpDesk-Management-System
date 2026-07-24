namespace backend.DTO.Ticket;
public class TicketAttachmentCreateDto
{
    public List<IFormFile> File {get; set; } = [];
    public Guid? CommentId {get; set; }
    public string? Description {get; set; }
}