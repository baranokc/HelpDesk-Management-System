namespace backend.Services.Notification;

public sealed class SlaNotificationWorker : BackgroundService
{
    private static readonly TimeSpan PollingInterval = TimeSpan.FromMinutes(1);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SlaNotificationWorker> _logger;

    public SlaNotificationWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<SlaNotificationWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
    CancellationToken stoppingToken)
{
    // 🌟 KRİTİK EKLENTİ: Web sunucusunun ve Migration/Seed adımlarının bitmesini bekle
    try
    {
        await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
    }
    catch (OperationCanceledException)
    {
        return;
    }

    while (!stoppingToken.IsCancellationRequested)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var notificationService = scope.ServiceProvider
                .GetRequiredService<INotificationService>();

            await notificationService.ProcessSlaAlertsAsync(
                stoppingToken);
        }
        catch (OperationCanceledException)
            when (stoppingToken.IsCancellationRequested)
        {
            break;
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "An error occurred while processing SLA notifications.");
        }

        try
        {
            await Task.Delay(PollingInterval, stoppingToken);
        }
        catch (OperationCanceledException)
            when (stoppingToken.IsCancellationRequested)
        {
            break;
        }
    }
}
}
