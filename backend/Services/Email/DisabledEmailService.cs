namespace backend.Services.Email;

public sealed class DisabledEmailService : IEmailService
{
    public Task SendPasswordResetEmailAsync(
        string recipientEmail,
        string recipientName,
        string resetLink,
        CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
    public Task SendRegistrationEmailAsync(
        string recipientEmail,
        string recipientName,
        CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
}
}