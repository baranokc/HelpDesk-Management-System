namespace backend.Services.Email;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(
        string recipientEmail,
        string recipientName,
        string resetLink,
        CancellationToken cancellationToken = default);
}
