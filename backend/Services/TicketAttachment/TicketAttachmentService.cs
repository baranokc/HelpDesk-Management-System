using backend.Data;
using backend.DTO.Ticket;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.TicketAttachment;

public class TicketAttachmentService : ITicketAttachmentService
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _environment;
    public TicketAttachmentService(AppDbContext db, IWebHostEnvironment environment) { _db = db; _environment = environment; }

    public async Task<IReadOnlyCollection<TicketAttachmentDto>> GetAttachmentsAsync(Guid ticketId, Guid? commentId = null, bool includeInternal = false, CancellationToken cancellationToken = default) =>
        await _db.TicketAttachments.AsNoTracking().Where(x =>
                x.TicketId == ticketId &&
                (!commentId.HasValue || x.TicketCommentId == commentId) &&
                (includeInternal || x.TicketCommentId == null || !x.TicketComment!.IsInternal))
            .OrderBy(x => x.UploadedAt).Select(MapExpression).ToListAsync(cancellationToken);

    public async Task<TicketAttachmentDto?> GetAttachmentByIdAsync(Guid ticketId, Guid attachmentId, bool includeInternal = false, CancellationToken cancellationToken = default) =>
        await _db.TicketAttachments.AsNoTracking().Where(x =>
                x.TicketId == ticketId &&
                x.Id == attachmentId &&
                (includeInternal || x.TicketCommentId == null || !x.TicketComment!.IsInternal))
            .Select(MapExpression).SingleOrDefaultAsync(cancellationToken);

    public async Task<TicketAttachmentDownloadDto?> GetDownloadAsync(Guid ticketId, Guid attachmentId, bool includeInternal = false, CancellationToken cancellationToken = default)
    {
        var item = await _db.TicketAttachments.AsNoTracking().SingleOrDefaultAsync(x =>
            x.TicketId == ticketId &&
            x.Id == attachmentId &&
            (includeInternal || x.TicketCommentId == null || !x.TicketComment!.IsInternal), cancellationToken);
        if (item is null) return null;
        var fileName = Path.GetFileName(item.FilePath);
        var physicalPath = Path.Combine(_environment.ContentRootPath, "uploads", fileName);
        if (!File.Exists(physicalPath)) return null;
        return new TicketAttachmentDownloadDto { PhysicalPath = physicalPath, ContentType = string.IsNullOrWhiteSpace(item.ContentType) ? "application/octet-stream" : item.ContentType, FileName = item.FileName };
    }

    public async Task<IReadOnlyCollection<TicketAttachmentDto>> AddAttachmentAsync(Guid ticketId, TicketAttachmentCreateDto dto, Guid uploaderId, CancellationToken cancellationToken = default)
    {
        if (!await _db.Tickets.AnyAsync(x => x.Id == ticketId && !x.IsDeleted, cancellationToken) || dto.Files.Count == 0) return Array.Empty<TicketAttachmentDto>();
        if (dto.CommentId.HasValue && !await _db.TicketComments.AnyAsync(x => x.Id == dto.CommentId && x.TicketId == ticketId, cancellationToken))
            throw new InvalidOperationException("Comment does not belong to this ticket.");
        return await SaveFilesAsync(ticketId, dto.CommentId, dto.Files, dto.Description, uploaderId, cancellationToken);
    }

    public Task<IReadOnlyCollection<TicketAttachmentDto>> AddCommentAttachmentsAsync(Guid ticketId, Guid commentId, IEnumerable<IFormFile> files, Guid uploaderId, CancellationToken cancellationToken = default) =>
        SaveFilesAsync(ticketId, commentId, files, null, uploaderId, cancellationToken);

    public async Task<TicketAttachmentDto?> UpdateAttachmentAsync(Guid ticketId, Guid attachmentId, TicketAttachmentUpdateDto dto, Guid userId, bool canManageAll, CancellationToken cancellationToken = default)
    {
        var item = await _db.TicketAttachments.Include(x => x.Uploader).SingleOrDefaultAsync(x => x.TicketId == ticketId && x.Id == attachmentId, cancellationToken);
        if (item is null) return null;
        if (!canManageAll && item.UploaderId != userId) throw new UnauthorizedAccessException("You can update only your own attachment.");
        item.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
        await _db.SaveChangesAsync(cancellationToken);
        return ToDto(item);
    }

    public async Task<bool> DeleteAttachmentAsync(Guid ticketId, Guid attachmentId, Guid userId, bool canManageAll, CancellationToken cancellationToken = default)
    {
        var item = await _db.TicketAttachments.SingleOrDefaultAsync(x => x.TicketId == ticketId && x.Id == attachmentId, cancellationToken);
        if (item is null) return false;
        if (!canManageAll && item.UploaderId != userId) throw new UnauthorizedAccessException("You can delete only your own attachment.");
        var physicalPath = Path.Combine(_environment.ContentRootPath, "uploads", Path.GetFileName(item.FilePath));
        _db.TicketAttachments.Remove(item);
        await _db.SaveChangesAsync(cancellationToken);
        if (File.Exists(physicalPath)) File.Delete(physicalPath);
        return true;
    }

    private async Task<IReadOnlyCollection<TicketAttachmentDto>> SaveFilesAsync(Guid ticketId, Guid? commentId, IEnumerable<IFormFile> files, string? description, Guid uploaderId, CancellationToken cancellationToken)
    {
        var list = files.Where(x => x.Length > 0).ToList();
        if (list.Count == 0) return Array.Empty<TicketAttachmentDto>();
        var folder = Path.Combine(_environment.ContentRootPath, "uploads"); Directory.CreateDirectory(folder);
        var result = new List<TicketAttachmentDto>();
        var createdPaths = new List<string>();
        var createdEntities = new List<Entities.TicketAttachment>();

        try
        {
            foreach (var file in list)
            {
                var storedName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName).ToLowerInvariant()}";
                var physicalPath = Path.Combine(folder, storedName);
                await using (var stream = new FileStream(physicalPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                    await file.CopyToAsync(stream, cancellationToken);

                createdPaths.Add(physicalPath);
                var item = new Entities.TicketAttachment { TicketId = ticketId, TicketCommentId = commentId, FileName = Path.GetFileName(file.FileName), FilePath = $"/uploads/{storedName}", ContentType = file.ContentType, FileSize = file.Length, Description = description?.Trim(), UploadedAt = DateTime.UtcNow, UploaderId = uploaderId };
                createdEntities.Add(item);
                _db.TicketAttachments.Add(item);
                result.Add(ToDto(item));
            }

            await _db.SaveChangesAsync(cancellationToken);
            return result;
        }
        catch
        {
            _db.TicketAttachments.RemoveRange(createdEntities);

            foreach (var createdPath in createdPaths)
            {
                if (File.Exists(createdPath))
                    File.Delete(createdPath);
            }

            throw;
        }
    }

    private static readonly System.Linq.Expressions.Expression<Func<Entities.TicketAttachment, TicketAttachmentDto>> MapExpression = x => new TicketAttachmentDto { Id = x.Id, FileName = x.FileName, ContentType = x.ContentType, FileSize = x.FileSize, DownloadUrl = x.FilePath, Description = x.Description, CommentId = x.TicketCommentId, UploadedById = x.UploaderId, UploadedByName = x.Uploader.Name + " " + x.Uploader.LastName, UploadedAt = x.UploadedAt };
    private static TicketAttachmentDto ToDto(Entities.TicketAttachment x) => new() { Id = x.Id, FileName = x.FileName, ContentType = x.ContentType, FileSize = x.FileSize, DownloadUrl = x.FilePath, Description = x.Description, CommentId = x.TicketCommentId, UploadedById = x.UploaderId, UploadedByName = x.Uploader is null ? null : x.Uploader.Name + " " + x.Uploader.LastName, UploadedAt = x.UploadedAt };
}
