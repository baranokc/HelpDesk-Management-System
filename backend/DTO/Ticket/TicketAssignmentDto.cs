namespace backend.DTO.Ticket;
public class TicketAssignmentDto
{
    public Guid TeamId {get; set; }
    public Guid? TeamMemberId {get; set; }
}