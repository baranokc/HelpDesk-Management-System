namespace backend.DTO.Ticket;
public class TicketAssignmentResponseDto
{
    public Guid Id { get; set; }
    public Guid TicketId{ get; set; }
    public Guid TeamId { get; set; }
    public string TeamName {get; set; } = string.Empty;
    public Guid? TeamMemberId {get; set; }
    public string? TeamMemberName {get; set; }
    public Guid AssignedById {get; set; }
    public string AssignedByName {get; set; } = string.Empty;
    public DateTime AssignedAt {get; set; }
    public string? Note {get; set; }
}