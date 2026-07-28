namespace backend.DTO.Ticket;

public class TicketCommentUpdateDto
{
    public string Comment { get; set; } = string.Empty;
    public bool IsInternal { get; set; }
}
