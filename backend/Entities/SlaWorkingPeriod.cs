namespace backend.Entities;

public class SlaWorkingPeriod
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SlaCalendarId { get; set; }
    public SlaCalendar SlaCalendar { get; set; } = null!;
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
}
