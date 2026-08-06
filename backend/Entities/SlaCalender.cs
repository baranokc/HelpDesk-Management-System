namespace backend.Entities;

public class SlaCalendar
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string TimeZoneId { get; set; } = "Europe/Istanbul";
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<SlaWorkingPeriod> WorkingPeriods { get; set; } =
        new List<SlaWorkingPeriod>();

    public ICollection<SlaHoliday> Holidays { get; set; } =
        new List<SlaHoliday>();

    public ICollection<Team> Teams { get; set; } = new List<Team>();
    public ICollection<SlaRecord> SlaRecords { get; set; } =
        new List<SlaRecord>();
}
