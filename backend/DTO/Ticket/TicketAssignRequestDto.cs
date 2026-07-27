namespace backend.DTO.Ticket;

public class TicketAssignRequestDto {
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public Guid TicketId { get; set; }
    public Guid? TeamMemberId { get; set; }
    public string? Note { get; set; }
}