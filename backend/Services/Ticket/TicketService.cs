using backend.Data;
using backend.Constants;
using backend.DTO.Common;
using backend.DTO.Ticket;
using Microsoft.EntityFrameworkCore;
using backend.Services.TicketAttachment;

namespace backend.Services.Ticket;

public class TicketService : ITicketService
{
    private readonly AppDbContext _db;
    private readonly ITicketAttachmentService _attachmentService;

    public TicketService(
        AppDbContext db,
        ITicketAttachmentService attachmentService)
    {
        _db = db;
        _attachmentService = attachmentService;
    }

    public async Task<PagedResultDto<TicketListDto>> GetTicketAsync(
        TicketFilterDto filter,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var query = _db.Tickets
            .AsNoTracking()
            .Where(t => !t.IsDeleted);

        query = ApplyAccessScope(
            query,
            currentUserId,
            currentUserRole);

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
        {
            var createdFromUtc = DateTime.SpecifyKind(
                filter.CreatedFrom.Value.Date,
                DateTimeKind.Utc);
            query = query.Where(t => t.CreatedAt >= createdFromUtc);
        }

        if (filter.CreatedTo.HasValue)
        {
            var createdToExclusiveUtc = DateTime.SpecifyKind(
                filter.CreatedTo.Value.Date.AddDays(1),
                DateTimeKind.Utc);
            query = query.Where(t => t.CreatedAt < createdToExclusiveUtc);
        }

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
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var ticketQuery = ApplyAccessScope(
            _db.Tickets.AsNoTracking(),
            currentUserId,
            currentUserRole);

        var ticket = await ticketQuery
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
            .Where(c =>
                c.TicketId == ticketId &&
                (currentUserRole != Roles.User || !c.IsInternal))
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
                        Description = a.Description,
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
            .Where(a =>
                a.TicketId == ticketId &&
                (currentUserRole != Roles.User ||
                 a.TicketCommentId == null ||
                 !a.TicketComment!.IsInternal))
            .OrderBy(a => a.UploadedAt)
            .Select(a => new TicketAttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                ContentType = a.ContentType,
                FileSize = a.FileSize,
                DownloadUrl = a.FilePath,
                Description = a.Description,
                CommentId = a.TicketCommentId,
                UploadedById = a.UploaderId,
                UploadedByName =
                    a.Uploader.Name + " " + a.Uploader.LastName,
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

    public async Task<bool> CanAccessTicketAsync(
        Guid ticketId,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var query = ApplyAccessScope(
            _db.Tickets.AsNoTracking().Where(t => !t.IsDeleted),
            currentUserId,
            currentUserRole);

        return await query.AnyAsync(
            t => t.Id == ticketId,
            cancellationToken);
    }

    public async Task<TicketResponseDto> CreateTicketAsync(
        TicketCreateDto dto,
        Guid createdBy,
        CancellationToken cancellationToken = default)
    {
        var categoryExists = await _db.TicketCategories
    .AnyAsync(
        x => x.Id == dto.CategoryId && x.IsActive,
        cancellationToken);

        if (!categoryExists)
            throw new ArgumentException("Selected category was not found.");

        var priorityExists = await _db.TicketPriorities
            .AnyAsync(
                x => x.Id == dto.PriorityId,
                cancellationToken);

        if (!priorityExists)
            throw new ArgumentException("Selected priority was not found.");

        var impactLevelExists = await _db.ImpactLevels
            .AnyAsync(
                x => x.Id == dto.ImpactLevelId && x.IsActive,
                cancellationToken);

        if (!impactLevelExists)
            throw new ArgumentException("Selected impact level was not found.");

        var urgencyLevelExists = await _db.UrgencyLevels
            .AnyAsync(
                x => x.Id == dto.UrgencyLevelId && x.IsActive,
                cancellationToken);

        if (!urgencyLevelExists)
            throw new ArgumentException("Selected urgency level was not found.");

        if (dto.SubcategoryId.HasValue)
        {
            var subcategoryExists = await _db.TicketSubCategories
                .AnyAsync(
                    x =>
                        x.Id == dto.SubcategoryId.Value &&
                        x.CategoryId == dto.CategoryId &&
                        x.IsActive,
                    cancellationToken);

            if (!subcategoryExists)
                throw new ArgumentException(
                    "Selected subcategory was not found or does not belong to the selected category.");
        }

        
        var initialStatus = await _db.TicketStatuses.SingleOrDefaultAsync(s => s.IsActive && s.IsInitial, cancellationToken)
            ?? throw new InvalidOperationException(
                "No active initial status was found.");

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

        if (dto.Attachments.Count > 0)
        {
            await _attachmentService.AddAttachmentAsync(
                ticket.Id,
                new TicketAttachmentCreateDto
                {
                    Files = dto.Attachments
                },
                createdBy,
                cancellationToken);
        }

    return await _db.Tickets
        .AsNoTracking()
        .Where(t => t.Id == ticket.Id)
        .Select(t => new TicketResponseDto
        {
            Id = t.Id,
            TicketTitle = t.TicketTitle,
            TicketDescription = t.TicketDescription,
            Subject = t.Subject,

            StatusName = t.Status.Name,
            PriorityName = t.Priority.Name,
            ImpactLevelName = t.ImpactLevel.Name,
            UrgencyLevelName = t.UrgencyLevel.Name,
            CategoryName = t.Category.Name,

            CreatedByName =
                t.CreatedBy.Name + " " + t.CreatedBy.LastName,

            AssignedToName = t.AssignedTo != null
                ? t.AssignedTo.Name + " " + t.AssignedTo.LastName
                : null,

            CreatedAt = t.CreatedAt
        })
        .SingleAsync(cancellationToken);
    }

    public async Task<TicketResponseDto?> UpdateTicketAsync(
        Guid ticketId,
        TicketUpdateDto dto,
        Guid changedByUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _db.Tickets
            .FirstOrDefaultAsync(
                t => t.Id == ticketId && !t.IsDeleted,
                cancellationToken);

        if (ticket is null)
            return null;
        if (!CanAccessTicket(
                ticket,
                changedByUserId,
                currentUserRole))
        {
            throw new UnauthorizedAccessException(
                "You do not have permission to update this ticket.");
        }

        await ValidateTicketLookupsAsync(
            dto.CategoryId,
            dto.SubcategoryId,
            dto.PriorityId,
            dto.ImpactLevelId,
            dto.UrgencyLevelId,
            cancellationToken);

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
                ImpactLevelName = t.ImpactLevel.Name,
                UrgencyLevelName = t.UrgencyLevel.Name,
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
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _db.Tickets
            .FirstOrDefaultAsync(
                t => t.Id == ticketId && !t.IsDeleted,
                cancellationToken);

        if (ticket is null)
            return false;

        if (!CanAccessTicket(
                ticket,
                deletedById,
                currentUserRole))
        {
            throw new UnauthorizedAccessException(
                "You do not have permission to delete this ticket.");
        }

        ticket.IsDeleted = true;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
    private async Task ValidateTicketLookupsAsync(
        Guid categoryId,
        Guid? subcategoryId,
        Guid priorityId,
        Guid impactLevelId,
        Guid urgencyLevelId,
        CancellationToken cancellationToken)
    {
        var categoryExists =
            await _db.TicketCategories.AnyAsync(
                category =>
                    category.Id == categoryId &&
                    category.IsActive,
                cancellationToken);

        if (!categoryExists)
        {
            throw new ArgumentException(
                "Selected category was not found.");
        }

        var priorityExists =
            await _db.TicketPriorities.AnyAsync(
                priority => priority.Id == priorityId,
                cancellationToken);

        if (!priorityExists)
        {
            throw new ArgumentException(
                "Selected priority was not found.");
        }

        var impactExists =
            await _db.ImpactLevels.AnyAsync(
                impact =>
                    impact.Id == impactLevelId &&
                    impact.IsActive,
                cancellationToken);

        if (!impactExists)
        {
            throw new ArgumentException(
                "Selected impact level was not found.");
        }

        var urgencyExists =
            await _db.UrgencyLevels.AnyAsync(
                urgency =>
                    urgency.Id == urgencyLevelId &&
                    urgency.IsActive,
                cancellationToken);

        if (!urgencyExists)
        {
            throw new ArgumentException(
                "Selected urgency level was not found.");
        }

        if (subcategoryId.HasValue)
        {
            var subcategoryExists =
                await _db.TicketSubCategories.AnyAsync(
                    subcategory =>
                        subcategory.Id == subcategoryId.Value &&
                        subcategory.CategoryId == categoryId &&
                        subcategory.IsActive,
                    cancellationToken);

            if (!subcategoryExists)
            {
                throw new ArgumentException(
                    "Selected subcategory was not found " +
                    "or does not belong to the selected category.");
            }
        }
    }
    private static string FormatTicketNumber(long sequenceValue)
    {
        return $"HD-{sequenceValue:D8}";
    }

    private static IQueryable<Entities.Ticket> ApplyAccessScope(
        IQueryable<Entities.Ticket> query,
        Guid currentUserId,
        string currentUserRole)
    {
        return currentUserRole switch
        {
            Roles.Admin => query,
            Roles.SupportAgent => query.Where(ticket =>
                ticket.CreatedById == currentUserId ||
                ticket.AssignedToId == currentUserId),
            Roles.User => query.Where(ticket =>
                ticket.CreatedById == currentUserId),
            _ => query.Where(_ => false)
        };
    }

    private static bool CanAccessTicket(
        Entities.Ticket ticket,
        Guid currentUserId,
        string currentUserRole)
    {
        return currentUserRole switch
        {
            Roles.Admin => true,
            Roles.SupportAgent =>
                ticket.CreatedById == currentUserId ||
                ticket.AssignedToId == currentUserId,
            Roles.User => ticket.CreatedById == currentUserId,
            _ => false
        };
    }
}
