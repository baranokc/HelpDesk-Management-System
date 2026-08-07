using backend.Entities;

namespace backend.DTO.Ticket;
public class TicketHistoryDto
{
    public Guid Id {get; set; }
    public Guid TicketId {get; set; }
    public TicketHistoryActionType ActionType {get; set; }
    public string? AvatarFileName {get; set;}
    public string? FieldName { get; set; }
    public string? OldValue {get; set; }
    public string? NewValue {get; set; }
    public string? Description {get; set; }
    public Guid ChangedById {get; set; }
    public string? ChangedByName {get; set; }
    public DateTime ChangedAt {get; set; }
}