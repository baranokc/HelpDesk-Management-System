namespace backend.DTO.Ticket;

public class TicketSlaSummaryDto
{
    public string CalendarName { get; set; } = string.Empty;
    public string TimeZoneId { get; set; } = string.Empty;
    public DateTime FirstResponseDueAt { get; set; }
    public DateTime? FirstResponseAt { get; set; }
    public string FirstResponseStatus { get; set; } = string.Empty;
    public DateTime ResolutionDueAt { get; set; }
    public DateTime? ResolutionAt { get; set; }
    public string ResolutionStatus { get; set; } = string.Empty;
    public bool IsPaused { get; set; }
}
