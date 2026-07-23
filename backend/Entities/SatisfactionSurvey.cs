namespace backend.Entities;
public class SatisfactionSurvey
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TicketId {get; set; }
    public Ticket Ticket { get; set; } = null!;
    public Guid UserId {get; set; }
    public User User { get; set; } = null!;
    public int Rating {get; set; }
    public int CommunicationRating {get; set; }
    public int SolutionRating {get; set; }
    public string Comment {get; set; } = string.Empty;
    public DateTime CreatedAt {get;set; } = DateTime.UtcNow;
}