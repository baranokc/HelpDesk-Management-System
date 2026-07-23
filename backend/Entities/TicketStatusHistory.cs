namespace backend.Entities;

public class TicketStatusHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TicketId { get; set; }
    public Ticket Ticket { get; set; } = null!;
    public Guid ChangedById { get; set; }
    public User ChangedBy { get; set; } = null!;

    public Guid? OldStatusId { get; set; }
    public TicketStatus? OldStatus { get; set; }
    public Guid NewStatusId { get; set; }
    public TicketStatus NewStatus { get; set; } = null!;

    public string? Reason { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}