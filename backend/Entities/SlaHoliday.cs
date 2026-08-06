namespace backend.Entities;

public class SlaHoliday
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SlaCalendarId { get; set; }
    public SlaCalendar SlaCalendar { get; set; } = null!;
    public DateOnly Date { get; set; }
    public string Name { get; set; } = string.Empty;
}
