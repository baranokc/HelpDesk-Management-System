namespace backend.DTO.Ticket;
public class TicketCommentDto
{
    public Guid Id {get; set; }
    public string Comment {get; set; } = string.Empty;
    public Guid CreatedById {get; set; }
    public string CreatedByName {get; set;} = string.Empty;
    public DateTime CreatedAt {get; set; }
    public DateTime? EditedAt {get; set; }
}