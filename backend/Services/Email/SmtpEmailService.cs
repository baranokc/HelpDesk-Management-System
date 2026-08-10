using System.Net;
using System.Net.Mail;
using System.Text.Encodings.Web;
using backend.Settings;
using Microsoft.Extensions.Options;

namespace backend.Services.Email;

public sealed class SmtpEmailService : IEmailService
{
    private readonly EmailSettings _settings;

    public SmtpEmailService(IOptions<EmailSettings> options)
    {
        _settings = options.Value;
    }

    public async Task SendPasswordResetEmailAsync(
        string recipientEmail,
        string recipientName,
        string resetLink,
        CancellationToken cancellationToken = default)
    {
        var encodedName = HtmlEncoder.Default.Encode(recipientName);
        var encodedLink = HtmlEncoder.Default.Encode(resetLink);

        using var message = new MailMessage
        {
            From = new MailAddress(_settings.FromAddress, _settings.FromName),
            Subject = "Reset your Help Desk password",
            IsBodyHtml = true,
            Body = $$"""
                <!DOCTYPE html>
                <html lang="en">
                <body style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
                    <div style="max-width:560px;margin:auto;background:#fff;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
                        <h2 style="color:#0f172a;">Reset your password</h2>
                        <p style="color:#475569;">Hello {{encodedName}},</p>
                        <p style="color:#475569;">A request was received to reset your Help Desk password.</p>
                        <p style="margin:28px 0;">
                            <a href="{{encodedLink}}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
                                Reset Password
                            </a>
                        </p>
                        <p style="color:#64748b;font-size:14px;">This link is valid for 30 minutes and can only be used once.</p>
                        <p style="color:#64748b;font-size:14px;">If you did not request this, you can ignore this email.</p>
                    </div>
                </body>
                </html>
                """
        };

        message.To.Add(new MailAddress(recipientEmail, recipientName));

        using var client = new SmtpClient(_settings.Host, _settings.Port)
        {
            EnableSsl = _settings.UseStartTls,
            Credentials = new NetworkCredential(
                _settings.Username,
                _settings.Password)
        };

        await client.SendMailAsync(message, cancellationToken);
    }

    public async Task SendRegistrationEmailAsync(
        string recipientEmail,
        string recipientName,
        CancellationToken cancellationToken = default)
    {
        var encodedName = HtmlEncoder.Default.Encode(recipientName);

        using var message = new MailMessage
        {
            From = new MailAddress(
                _settings.FromAddress,
                _settings.FromName),
            Subject = "Your Help Desk account has been created",
            IsBodyHtml = true,
            Body = $$"""
                <!DOCTYPE html>
                <html lang="en">
                <body style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
                    <div style="max-width:560px;margin:auto;background:#ffffff;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
                        <h2 style="color:#0f172a;">
                            Welcome to Help Desk
                        </h2>

                        <p style="color:#475569;">
                            Hello {{encodedName}},
                        </p>

                        <p style="color:#475569;">
                            Your Help Desk account has been created successfully.
                        </p>

                        <p style="color:#64748b;font-size:14px;">
                            You can now sign in using your registered email address.
                        </p>
                    </div>
                </body>
                </html>
                """
        };

        message.To.Add(
            new MailAddress(recipientEmail, recipientName));

        using var client = new SmtpClient(
            _settings.Host,
            _settings.Port)
        {
            EnableSsl = _settings.UseStartTls,
            Credentials = new NetworkCredential(
                _settings.Username,
                _settings.Password)
        };

        await client.SendMailAsync(
            message,
            cancellationToken);
    }
}
