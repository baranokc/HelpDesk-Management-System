using backend.Entities;

namespace backend.Services.Sla;

public interface IBusinessTimeCalculator
{
    DateTimeOffset AddWorkingTime(
        DateTimeOffset startUtc,
        TimeSpan duration,
        SlaCalendar calendar);

    TimeSpan GetWorkingTime(
        DateTimeOffset startUtc,
        DateTimeOffset endUtc,
        SlaCalendar calendar);

    bool IsWorkingTime(
        DateTimeOffset instantUtc,
        SlaCalendar calendar);
}
