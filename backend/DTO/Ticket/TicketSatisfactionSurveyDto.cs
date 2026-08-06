namespace backend.DTO.Ticket;

public class SatisfactionSurveyDto
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public Guid UserId { get; set; }
    public int Rating { get; set; }
    public int CommunicationRating { get; set; }
    public int SolutionRating { get; set; }
    public int SpeedRating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}