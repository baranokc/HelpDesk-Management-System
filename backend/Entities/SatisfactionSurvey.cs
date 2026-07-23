namespace backend.Entities;
public class SatisfactionSurvey
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ticketId {get; set; }
    public Ticket Ticket { get; set; } = null!;
    public Guid userId {get; set; }
    public User User { get; set; } = null!;
    public int rating {get; set; }
    public int communicationRating {get; set; }
    public int solutionRating {get; set; }
    public string comment {get; set; } = string.Empty;
    public DateTime createdAt {get;set; } = DateTime.UtcNow;
}