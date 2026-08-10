namespace backend.Entities;

public sealed class TeamChatMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? TeamId { get; set; }
    public Team? Team { get; set; }
    public TeamChatAudience Audience { get; set; } = TeamChatAudience.Team;
    public Guid SenderId { get; set; }
    public User Sender { get; set; } = null!;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
