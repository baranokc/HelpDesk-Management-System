namespace backend.DTO.Ticket;

public class CreateSatisfactionSurveyDto
{
    public int Rating { get; set; }
    public int CommunicationRating { get; set; }
    public int SolutionRating { get; set; }
    public int SpeedRating { get; set; }
    public string Comment { get; set; } = string.Empty;
}