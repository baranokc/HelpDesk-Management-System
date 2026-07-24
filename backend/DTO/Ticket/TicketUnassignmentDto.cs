namespace backend.DTO.Ticket;
public class TicketUnassignmentDto
{
    public string? Reason {get; set; }
    public bool KeepTeamAssignment {get; set; }
}