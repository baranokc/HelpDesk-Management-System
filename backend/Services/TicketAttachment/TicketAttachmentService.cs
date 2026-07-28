using backend.Data;
using backend.DTO.Ticket;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.TicketAttachment;

public class TicketAttachmentService : ITicketAttachmentService
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _environment;

    public TicketAttachmentService(
        AppDbContext db,
        IWebHostEnvironment environment)
    {
        _db = db;
        _environment = environment;
    }

    public async Task<IReadOnlyCollection<TicketAttachmentDto>> AddAttachmentAsync(
        Guid ticketId,
        TicketAttachmentCreateDto dto,
        Guid uploaderId,
        CancellationToken cancellationToken = default)
    {
        var ticketExists = await _db.Tickets.AnyAsync(
            t => t.Id == ticketId && !t.IsDeleted,
            cancellationToken);

        if (!ticketExists || dto.Files.Count == 0)
            return Array.Empty<TicketAttachmentDto>();

        if (dto.CommentId.HasValue)
        {
            var commentExists = await _db.TicketComments.AnyAsync(
                c => c.Id == dto.CommentId.Value && c.TicketId == ticketId,
                cancellationToken);

            if (!commentExists)
                throw new InvalidOperationException("Comment does not belong to this ticket.");
        }

        return await SaveFilesAsync(
            ticketId,
            dto.CommentId,
            dto.Files,
            dto.Description,
            uploaderId,
            cancellationToken);
    }

    public async Task<IReadOnlyCollection<TicketAttachmentDto>> AddCommentAttachmentsAsync(
        Guid ticketId,
        Guid commentId,
        IEnumerable<IFormFile> files,
        Guid uploaderId,
        CancellationToken cancellationToken = default)
    {
        return await SaveFilesAsync(
            ticketId,
            commentId,
            files,
            null,
            uploaderId,
            cancellationToken);
    }

    private async Task<IReadOnlyCollection<TicketAttachmentDto>> SaveFilesAsync(
        Guid ticketId,
        Guid? commentId,
        IEnumerable<IFormFile> files,
        string? description,
        Guid uploaderId,
        CancellationToken cancellationToken)
    {
        var fileList = files.Where(f => f.Length > 0).ToList();
        if (fileList.Count == 0)
            return Array.Empty<TicketAttachmentDto>();

        var uploadsFolder = Path.Combine(
            _environment.ContentRootPath,
            "uploads");

        Directory.CreateDirectory(uploadsFolder);

        var result = new List<TicketAttachmentDto>();

        foreach (var file in fileList)
        {
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
            var physicalPath = Path.Combine(uploadsFolder, uniqueFileName);
            var downloadUrl = $"/uploads/{uniqueFileName}";

            await using (var stream = new FileStream(
                physicalPath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            var attachment = new Entities.TicketAttachment
            {
                TicketId = ticketId,
                TicketCommentId = commentId,
                FileName = file.FileName,
                FilePath = downloadUrl,
                ContentType = file.ContentType,
                FileSize = file.Length,
                Description = description,
                UploadedAt = DateTime.UtcNow,
                UploaderId = uploaderId
            };

            _db.TicketAttachments.Add(attachment);

            result.Add(new TicketAttachmentDto
            {
                Id = attachment.Id,
                FileName = attachment.FileName,
                ContentType = attachment.ContentType,
                FileSize = attachment.FileSize,
                DownloadUrl = attachment.FilePath,
                CommentId = attachment.TicketCommentId,
                UploadedById = uploaderId,
                UploadedAt = attachment.UploadedAt
            });
        }

        await _db.SaveChangesAsync(cancellationToken);
        return result;
    }
}
