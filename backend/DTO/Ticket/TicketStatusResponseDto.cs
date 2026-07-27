namespace backend.DTO.Ticket;

public class TicketStatusResponseDto
{
    public Guid TicketId { get; set; }
    public Guid StatusId { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public string? StatusDescription { get; set; }
    public bool IsClosed { get; set; }
    public Guid UpdatedById { get; set; }
    public string UpdatedByName { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
    public string? Reason { get; set; }
}