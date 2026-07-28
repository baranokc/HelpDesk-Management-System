using backend.Data;
using backend.DTO.Common;
using backend.DTO.Ticket;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Ticket;

public class TicketService : ITicketService
{
    private readonly AppDbContext _db;

    public TicketService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResultDto<TicketListDto>> GetTicketAsync(
        TicketFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var query = _db.Tickets
            .AsNoTracking()
            .Where(t => !t.IsDeleted);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim();
            query = query.Where(t =>
                EF.Functions.ILike(t.TicketNumber, $"%{search}%") ||
                EF.Functions.ILike(t.TicketTitle, $"%{search}%") ||
                EF.Functions.ILike(t.Subject, $"%{search}%") ||
                EF.Functions.ILike(t.TicketDescription, $"%{search}%"));
        }

        if (filter.StatusId.HasValue)
            query = query.Where(t => t.StatusId == filter.StatusId.Value);

        if (filter.CategoryId.HasValue)
            query = query.Where(t => t.CategoryId == filter.CategoryId.Value);

        if (filter.AssignedToId.HasValue)
            query = query.Where(t => t.AssignedToId == filter.AssignedToId.Value);

        if (filter.CreatedById.HasValue)
            query = query.Where(t => t.CreatedById == filter.CreatedById.Value);

        if (filter.UrgencyLevelId.HasValue)
            query = query.Where(t => t.UrgencyLevelId == filter.UrgencyLevelId.Value);

        if (filter.ImpactLevelId.HasValue)
            query = query.Where(t => t.ImpactLevelId == filter.ImpactLevelId.Value);

        if (filter.CreatedFrom.HasValue)
            query = query.Where(t => t.CreatedAt >= filter.CreatedFrom.Value);

        if (filter.CreatedTo.HasValue)
            query = query.Where(t => t.CreatedAt <= filter.CreatedTo.Value);

        var pageNumber = Math.Max(filter.PageNumber, 1);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);
        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TicketListDto
            {
                Id = t.Id,
                TicketNumber = t.TicketNumber,
                TicketTitle = t.TicketTitle,
                StatusName = t.Status.Name,
                PriorityName = t.Priority.Name,
                CategoryName = t.Category.Name,
                SubcategoryName = t.Subcategory != null ? t.Subcategory.Name : null,
                CreatedByName = t.CreatedBy.Name + " " + t.CreatedBy.LastName,
                AssignedToName = t.AssignedTo != null
                    ? t.AssignedTo.Name + " " + t.AssignedTo.LastName
                    : null,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var totalPages = totalCount == 0
            ? 0
            : (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PagedResultDto<TicketListDto>(
            items,
            pageNumber,
            pageSize,
            totalCount,
            totalPages);
    }

    public async Task<TicketDetailDto?> GetTicketByAsync(
        Guid ticketId,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _db.Tickets
            .AsNoTracking()
            .Include(t => t.CreatedBy)
            .Include(t => t.AssignedTo)
            .Include(t => t.Team)
            .Include(t => t.Status)
            .Include(t => t.Priority)
            .Include(t => t.Category)
            .Include(t => t.Subcategory)
            .Include(t => t.ImpactLevel)
            .Include(t => t.UrgencyLevel)
            .FirstOrDefaultAsync(
                t => t.Id == ticketId && !t.IsDeleted,
                cancellationToken);

        if (ticket is null)
            return null;

        var comments = await _db.TicketComments
            .AsNoTracking()
            .Where(c => c.TicketId == ticketId)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new TicketCommentDto
            {
                Id = c.Id,
                Comment = c.Comment,
                CreatedById = c.UserId,
                CreatedByName = c.User.Name + " " + c.User.LastName,
                CreatedAt = c.CreatedAt,
                EditedAt = c.EditedAt,
                IsInternal = c.IsInternal,
                Attachments = c.Attachments
                    .Select(a => new TicketAttachmentDto
                    {
                        Id = a.Id,
                        FileName = a.FileName,
                        ContentType = a.ContentType,
                        FileSize = a.FileSize,
                        DownloadUrl = a.FilePath,
                        CommentId = a.TicketCommentId,
                        UploadedById = a.UploaderId,
                        UploadedByName = a.Uploader.Name + " " + a.Uploader.LastName,
                        UploadedAt = a.UploadedAt
                    })
                    .ToList()
            })
            .ToListAsync(cancellationToken);

        var attachments = await _db.TicketAttachments
            .AsNoTracking()
            .Where(a => a.TicketId == ticketId && a.TicketCommentId == null)
            .OrderBy(a => a.UploadedAt)
            .Select(a => new TicketAttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                ContentType = a.ContentType,
                FileSize = a.FileSize,
                DownloadUrl = a.FilePath,
                CommentId = a.TicketCommentId,
                UploadedById = a.UploaderId,
                UploadedByName = a.Uploader.Name + " " + a.Uploader.LastName,
                UploadedAt = a.UploadedAt
            })
            .ToListAsync(cancellationToken);

        return new TicketDetailDto
        {
            Id = ticket.Id,
            TicketNumber = ticket.TicketNumber,
            TicketTitle = ticket.TicketTitle,
            TicketDescription = ticket.TicketDescription,
            Subject = ticket.Subject,
            TeamId = ticket.TeamId,
            TeamName = ticket.Team?.Name,
            StatusId = ticket.StatusId,
            StatusName = ticket.Status.Name,
            PriorityId = ticket.PriorityId,
            PriorityName = ticket.Priority.Name,
            CategoryId = ticket.CategoryId,
            CategoryName = ticket.Category.Name,
            SubcategoryId = ticket.SubcategoryId,
            SubcategoryName = ticket.Subcategory?.Name,
            ImpactLevelId = ticket.ImpactLevelId,
            ImpactLevelName = ticket.ImpactLevel.Name,
            UrgencyLevelId = ticket.UrgencyLevelId,
            UrgencyLevelName = ticket.UrgencyLevel.Name,
            CreatedById = ticket.CreatedById,
            CreatedByName = $"{ticket.CreatedBy.Name} {ticket.CreatedBy.LastName}",
            AssignedToId = ticket.AssignedToId,
            AssignedToName = ticket.AssignedTo != null
                ? $"{ticket.AssignedTo.Name} {ticket.AssignedTo.LastName}"
                : null,
            CreatedAt = ticket.CreatedAt,
            FirstResponseAt = ticket.FirstResponseAt,
            ResolvedAt = ticket.ResolvedAt,
            ClosedAt = ticket.ClosedAt,
            Comments = comments,
            Attachments = attachments
        };
    }

    public async Task<TicketResponseDto> CreateTicketAsync(
        TicketCreateDto dto,
        Guid createdBy,
        CancellationToken cancellationToken = default)
    {
        var initialStatus = await _db.TicketStatuses
            .FirstOrDefaultAsync(s => s.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("No active initial state found.");

        var rawSequenceValue = await _db.Database
            .SqlQueryRaw<long>(
                "SELECT nextval('\"public\".\"TicketNumberSequence\"') AS \"Value\"")
            .SingleAsync(cancellationToken);

        var ticket = new Entities.Ticket
        {
            TicketNumber = FormatTicketNumber(rawSequenceValue),
            TicketTitle = dto.TicketTitle.Trim(),
            TicketDescription = dto.TicketDescription.Trim(),
            Subject = dto.Subject.Trim(),
            CreatedById = createdBy,
            CategoryId = dto.CategoryId,
            SubcategoryId = dto.SubcategoryId,
            StatusId = initialStatus.Id,
            PriorityId = dto.PriorityId,
            ImpactLevelId = dto.ImpactLevelId,
            UrgencyLevelId = dto.UrgencyLevelId,
            CreatedAt = DateTime.UtcNow
        };

        _db.Tickets.Add(ticket);
        await _db.SaveChangesAsync(cancellationToken);

        return new TicketResponseDto
        {
            Id = ticket.Id,
            TicketTitle = ticket.TicketTitle,
            TicketDescription = ticket.TicketDescription,
            Subject = ticket.Subject,
            StatusName = initialStatus.Name,
            CreatedAt = ticket.CreatedAt
        };
    }

    public async Task<TicketResponseDto?> UpdateTicketAsync(
        Guid ticketId,
        TicketUpdateDto dto,
        Guid changedByUserId,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _db.Tickets
            .FirstOrDefaultAsync(
                t => t.Id == ticketId && !t.IsDeleted,
                cancellationToken);

        if (ticket is null)
            return null;

        ticket.TicketTitle = dto.TicketTitle.Trim();
        ticket.TicketDescription = dto.TicketDescription.Trim();
        ticket.Subject = dto.Subject.Trim();
        ticket.CategoryId = dto.CategoryId;
        ticket.SubcategoryId = dto.SubcategoryId;
        ticket.PriorityId = dto.PriorityId;
        ticket.ImpactLevelId = dto.ImpactLevelId;
        ticket.UrgencyLevelId = dto.UrgencyLevelId;

        await _db.SaveChangesAsync(cancellationToken);

        return await _db.Tickets
            .AsNoTracking()
            .Where(t => t.Id == ticketId)
            .Select(t => new TicketResponseDto
            {
                Id = t.Id,
                TicketTitle = t.TicketTitle,
                TicketDescription = t.TicketDescription,
                Subject = t.Subject,
                StatusName = t.Status.Name,
                PriorityName = t.Priority.Name,
                CategoryName = t.Category.Name,
                CreatedByName = t.CreatedBy.Name + " " + t.CreatedBy.LastName,
                AssignedToName = t.AssignedTo != null
                    ? t.AssignedTo.Name + " " + t.AssignedTo.LastName
                    : null,
                CreatedAt = t.CreatedAt
            })
            .SingleAsync(cancellationToken);
    }

    public async Task<bool> DeleteTicketAsync(
        Guid ticketId,
        Guid deletedById,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _db.Tickets
            .FirstOrDefaultAsync(
                t => t.Id == ticketId && !t.IsDeleted,
                cancellationToken);

        if (ticket is null)
            return false;

        ticket.IsDeleted = true;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static string FormatTicketNumber(long sequenceValue)
    {
        return $"HD-{sequenceValue:D8}";
    }
}
