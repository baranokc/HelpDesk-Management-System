using backend.Entities;

namespace backend.Services.Sla;

public sealed class BusinessTimeCalculator : IBusinessTimeCalculator
{
    private const int MaximumSearchDays = 3650; // 10 yıl arama limiti (CPU kilitlenmesini önler)

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
            var periods = GetPeriods(calendar, date, timeZone);
            foreach (var period in periods)
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
            var nextDayStart = ToUtc(date, TimeOnly.MinValue, timeZone);
            if (nextDayStart > cursorUtc)
                cursorUtc = nextDayStart;
        }

        throw new InvalidOperationException(
            $"A working-time deadline could not be calculated from the SLA calendar '{calendar.Name}'. No working time available within {MaximumSearchDays} days.");
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
            var periods = GetPeriods(calendar, date, timeZone);
            foreach (var period in periods)
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

        foreach (var period in GetPeriods(calendar, date, timeZone))
        {
            if (instant >= period.StartUtc && instant < period.EndUtc)
                return true;
        }

        return false;
    }

    // 🌟 DÜZELTME: ICollection indeks erişim hatası düzeltildi (foreach kullanıldı)
    private static IReadOnlyList<WorkingPeriodBoundary> GetPeriods(
        SlaCalendar calendar,
        DateOnly date,
        TimeZoneInfo timeZone)
    {
        var holidays = calendar.Holidays;
        if (holidays is not null && holidays.Count > 0)
        {
            foreach (var holiday in holidays)
            {
                if (holiday.Date == date)
                    return Array.Empty<WorkingPeriodBoundary>();
            }
        }

        var workingPeriods = calendar.WorkingPeriods;
        if (workingPeriods is null || workingPeriods.Count == 0)
            return Array.Empty<WorkingPeriodBoundary>();

        List<WorkingPeriodBoundary>? matching = null;

        foreach (var period in workingPeriods)
        {
            if (period.DayOfWeek == date.DayOfWeek)
            {
                matching ??= new List<WorkingPeriodBoundary>();
                matching.Add(new WorkingPeriodBoundary(
                    ToUtc(date, period.StartTime, timeZone),
                    ToUtc(date, period.EndTime, timeZone)));
            }
        }

        if (matching is null || matching.Count == 0)
            return Array.Empty<WorkingPeriodBoundary>();

        if (matching.Count > 1)
            matching.Sort((a, b) => a.StartUtc.CompareTo(b.StartUtc));

        return matching;
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

        var zoneId = calendar.TimeZoneId.Trim();

        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(zoneId);
        }
        catch (Exception)
        {
            if (TimeZoneInfo.TryConvertWindowsIdToIanaId(zoneId, out var ianaId))
            {
                try
                {
                    return TimeZoneInfo.FindSystemTimeZoneById(ianaId);
                }
                catch
                {
                    // Fallback
                }
            }

            if (TimeZoneInfo.TryConvertIanaIdToWindowsId(zoneId, out var winId))
            {
                try
                {
                    return TimeZoneInfo.FindSystemTimeZoneById(winId);
                }
                catch
                {
                    // Fallback
                }
            }

            return TimeZoneInfo.Utc;
        }
    }

    // 🌟 DÜZELTME: ICollection indeks erişim hatası düzeltildi
    private static void EnsureUsableCalendar(SlaCalendar calendar)
    {
        if (!calendar.IsActive)
            throw new InvalidOperationException(
                $"SLA calendar '{calendar.Name}' is not active.");

        if (calendar.WorkingPeriods is null || calendar.WorkingPeriods.Count == 0)
            throw new InvalidOperationException(
                $"SLA calendar '{calendar.Name}' has no working periods loaded or defined.");

        foreach (var period in calendar.WorkingPeriods)
        {
            if (period.StartTime >= period.EndTime)
            {
                throw new InvalidOperationException(
                    $"SLA calendar '{calendar.Name}' contains an invalid working period.");
            }
        }
    }

    private sealed record WorkingPeriodBoundary(
        DateTimeOffset StartUtc,
        DateTimeOffset EndUtc);
}