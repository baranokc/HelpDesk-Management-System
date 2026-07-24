namespace backend.DTO.Ticket;
public class TicketCommentCreateDto
{
    public string Comment {get; set;} = string.Empty;
    public List<IFormFile> Attachments { get; set; } = [];
    public bool IsInternal {get; set; }
}
