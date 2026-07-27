namespace backend.DTO.Ticket;
public class TicketStatusUpdateDto
{
    public Guid TicketId{ get; set; } 
    public Guid StatusId { get; set; }
    public string? Reason {get; set; }
}