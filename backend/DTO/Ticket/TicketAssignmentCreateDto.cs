namespace backend.DTO.Ticket;

public class TicketAssignmentCreateDto
{
    public Guid TicketId { get; set; }
    public Guid AssignedById { get; set; }
    public string? Note { get; set; }
}