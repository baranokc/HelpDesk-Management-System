namespace backend.DTO.Ticket;
public class TicketStatusUpdateDto
{
    public Guid StatusId {get; set; }
    public string? Reason {get; set; }
}