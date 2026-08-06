using backend.Entities;

namespace backend.Services.Sla;

public sealed class BusinessTimeCalculator : IBusinessTimeCalculator
{
    private const int MaximumSearchDays = 36600;

    public DateTimeOffset AddWorkingTime(
        DateTimeOffset startUtc,
        TimeSpan duration,
        SlaCalendar calendar)
    {
        ArgumentNullException.ThrowIfNull(calendar);

        if (duration < TimeSpan.Zero)
            throw new ArgumentOutOfRangeException(
                nameof(duration),
                "Working duration cannot be negative.");

        if (duration == TimeSpan.Zero)
            return startUtc.ToUniversalTime();

        EnsureUsableCalendar(calendar);

        var timeZone = GetTimeZone(calendar);
        var remaining = duration;
        var cursorUtc = startUtc.ToUniversalTime();
        var localCursor = TimeZoneInfo.ConvertTime(cursorUtc, timeZone);
        var date = DateOnly.FromDateTime(localCursor.DateTime);

        for (var searchedDays = 0;
             searchedDays < MaximumSearchDays;
             searchedDays++)
        {
            foreach (var period in GetPeriods(calendar, date, timeZone))
            {
                if (cursorUtc >= period.EndUtc)
                    continue;

                if (cursorUtc < period.StartUtc)
                    cursorUtc = period.StartUtc;

                var available = period.EndUtc - cursorUtc;

                if (remaining <= available)
                    return (cursorUtc + remaining).ToUniversalTime();

                remaining -= available;
                cursorUtc = period.EndUtc;
            }

            date = date.AddDays(1);
            cursorUtc = ToUtc(date, TimeOnly.MinValue, timeZone);
        }

        throw new InvalidOperationException(
            "A working-time deadline could not be calculated from the configured calendar.");
    }

    public TimeSpan GetWorkingTime(
        DateTimeOffset startUtc,
        DateTimeOffset endUtc,
        SlaCalendar calendar)
    {
        ArgumentNullException.ThrowIfNull(calendar);

        var start = startUtc.ToUniversalTime();
        var end = endUtc.ToUniversalTime();

        if (end <= start)
            return TimeSpan.Zero;

        EnsureUsableCalendar(calendar);

        var timeZone = GetTimeZone(calendar);
        var localStart = TimeZoneInfo.ConvertTime(start, timeZone);
        var localEnd = TimeZoneInfo.ConvertTime(end, timeZone);
        var date = DateOnly.FromDateTime(localStart.DateTime);
        var lastDate = DateOnly.FromDateTime(localEnd.DateTime);
        var total = TimeSpan.Zero;

        for (var searchedDays = 0;
             date <= lastDate && searchedDays < MaximumSearchDays;
             searchedDays++, date = date.AddDays(1))
        {
            foreach (var period in GetPeriods(calendar, date, timeZone))
            {
                var overlapStart = start > period.StartUtc
                    ? start
                    : period.StartUtc;
                var overlapEnd = end < period.EndUtc
                    ? end
                    : period.EndUtc;

                if (overlapEnd > overlapStart)
                    total += overlapEnd - overlapStart;
            }
        }

        return total;
    }

    public bool IsWorkingTime(
        DateTimeOffset instantUtc,
        SlaCalendar calendar)
    {
        ArgumentNullException.ThrowIfNull(calendar);
        EnsureUsableCalendar(calendar);

        var instant = instantUtc.ToUniversalTime();
        var timeZone = GetTimeZone(calendar);
        var localInstant = TimeZoneInfo.ConvertTime(instant, timeZone);
        var date = DateOnly.FromDateTime(localInstant.DateTime);

        return GetPeriods(calendar, date, timeZone)
            .Any(period =>
                instant >= period.StartUtc &&
                instant < period.EndUtc);
    }

    private static IReadOnlyCollection<WorkingPeriodBoundary> GetPeriods(
        SlaCalendar calendar,
        DateOnly date,
        TimeZoneInfo timeZone)
    {
        if (calendar.Holidays.Any(holiday => holiday.Date == date))
            return Array.Empty<WorkingPeriodBoundary>();

        return calendar.WorkingPeriods
            .Where(period => period.DayOfWeek == date.DayOfWeek)
            .OrderBy(period => period.StartTime)
            .Select(period => new WorkingPeriodBoundary(
                ToUtc(date, period.StartTime, timeZone),
                ToUtc(date, period.EndTime, timeZone)))
            .ToList();
    }

    private static DateTimeOffset ToUtc(
        DateOnly date,
        TimeOnly time,
        TimeZoneInfo timeZone)
    {
        var localDateTime = date.ToDateTime(
            time,
            DateTimeKind.Unspecified);

        if (timeZone.IsInvalidTime(localDateTime))
        {
            do
            {
                localDateTime = localDateTime.AddMinutes(1);
            }
            while (timeZone.IsInvalidTime(localDateTime));
        }

        var utc = TimeZoneInfo.ConvertTimeToUtc(
            localDateTime,
            timeZone);

        return new DateTimeOffset(utc, TimeSpan.Zero);
    }

    private static TimeZoneInfo GetTimeZone(SlaCalendar calendar)
    {
        if (string.IsNullOrWhiteSpace(calendar.TimeZoneId))
            throw new InvalidOperationException(
                $"SLA calendar '{calendar.Name}' has no time-zone identifier.");

        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(
                calendar.TimeZoneId);
        }
        catch (TimeZoneNotFoundException exception)
        {
            throw new InvalidOperationException(
                $"SLA calendar time zone '{calendar.TimeZoneId}' was not found.",
                exception);
        }
        catch (InvalidTimeZoneException exception)
        {
            throw new InvalidOperationException(
                $"SLA calendar time zone '{calendar.TimeZoneId}' is invalid.",
                exception);
        }
    }

    private static void EnsureUsableCalendar(SlaCalendar calendar)
    {
        if (!calendar.IsActive)
            throw new InvalidOperationException(
                $"SLA calendar '{calendar.Name}' is not active.");

        if (calendar.WorkingPeriods.Count == 0)
            throw new InvalidOperationException(
                $"SLA calendar '{calendar.Name}' has no working periods.");

        if (calendar.WorkingPeriods.Any(period =>
                period.StartTime >= period.EndTime))
        {
            throw new InvalidOperationException(
                $"SLA calendar '{calendar.Name}' contains an invalid working period.");
        }
    }

    private sealed record WorkingPeriodBoundary(
        DateTimeOffset StartUtc,
        DateTimeOffset EndUtc);
}
