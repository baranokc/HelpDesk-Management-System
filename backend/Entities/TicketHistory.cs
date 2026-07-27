namespace backend.Entities;

public class TicketHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TicketId { get; set; }
    public Ticket Ticket { get; set; } = null!;

    public TicketHistoryActionType ActionType { get; set; }

    public string? FieldName { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }

    public Guid ChangedById { get; set; }
    public User ChangedBy { get; set; } = null!;

    public DateTime ChangedAt { get; set; }
    public string? Description { get; set; }
}