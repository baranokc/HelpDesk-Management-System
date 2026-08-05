using backend.Data;
using backend.Constants;
using backend.DTO.Ticket;
using Microsoft.EntityFrameworkCore;
using backend.Services.TicketAttachment;
using backend.Services.Notification;
using backend.Services.Sla;

namespace backend.Services.Ticket;

public class TicketService : ITicketService
{
    private readonly AppDbContext _db;
    private readonly ITicketAttachmentService _attachmentService;
    private readonly INotificationService _notificationService;
    private readonly ISlaService _slaService;

    public TicketService(
        AppDbContext db,
        ITicketAttachmentService attachmentService,
        INotificationService notificationService,
        ISlaService slaService)
    {
        _db = db;
        _attachmentService = attachmentService;
        _notificationService = notificationService;
        _slaService = slaService;
    }

    public async Task<TicketPagedResultDto> GetTicketAsync(
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
        var statusCounts = await query
            .GroupBy(t => t.Status.Name)
            .Select(group => new
            {
                StatusName = group.Key,
                Count = group.Count()
            })
            .ToListAsync(cancellationToken);

        int CountStatuses(params string[] names)
        {
            return statusCounts
                .Where(status => names.Contains(
                    status.StatusName,
                    StringComparer.OrdinalIgnoreCase))
                .Sum(status => status.Count);
        }

        var totalCount = statusCounts.Sum(status => status.Count);
        var openCount = CountStatuses("Open", "New");
        var inProgressCount = CountStatuses(
            "In Progress",
            "On Hold",
            "Waiting for User");
        var completedCount = CountStatuses(
            "Resolved",
            "Closed",
            "Cancelled");

        var items = await query
            .OrderByDescending(t => t.TicketNumber)
            .ThenByDescending(t => t.CreatedAt)
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

        return new TicketPagedResultDto(
            items,
            pageNumber,
            pageSize,
            totalCount,
            totalPages,
            openCount,
            inProgressCount,
            completedCount);
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

        var slaRecord = await _db.SlaRecords
            .AsNoTracking()
            .Where(record => record.TicketId == ticketId)
            .Select(record => new
            {
                record.FirstResponseDueAt,
                record.FirstResponseAt,
                record.ResolutionDueAt,
                record.ResolutionAt,
                record.IsPaused
            })
            .FirstOrDefaultAsync(cancellationToken);

        var now = DateTime.UtcNow;
        TicketSlaSummaryDto? sla = null;

        if (slaRecord is not null)
        {
            sla = new TicketSlaSummaryDto
            {
                FirstResponseDueAt = slaRecord.FirstResponseDueAt,
                FirstResponseAt = slaRecord.FirstResponseAt,
                FirstResponseStatus = GetSlaStatus(
                    slaRecord.FirstResponseDueAt,
                    slaRecord.FirstResponseAt,
                    now),
                ResolutionDueAt = slaRecord.ResolutionDueAt,
                ResolutionAt = slaRecord.ResolutionAt,
                ResolutionStatus = GetSlaStatus(
                    slaRecord.ResolutionDueAt,
                    slaRecord.ResolutionAt,
                    now),
                IsPaused = slaRecord.IsPaused
            };
        }

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
            Sla = sla,
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

    public async Task<bool> CanProcessTicketAsync(
        Guid ticketId,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var query = _db.Tickets
            .AsNoTracking()
            .Where(ticket =>
                ticket.Id == ticketId &&
                !ticket.IsDeleted);

        if (currentUserRole == Roles.Admin)
            return await query.AnyAsync(cancellationToken);

        if (currentUserRole == Roles.SupportAgent)
        {
            return await query.AnyAsync(
                ticket => ticket.AssignedToId == currentUserId,
                cancellationToken);
        }

        if (currentUserRole == Roles.TeamLeader)
        {
            return await ApplyAccessScope(
                    query,
                    currentUserId,
                    currentUserRole)
                .AnyAsync(cancellationToken);
        }

        return false;
    }

    public async Task<TicketResponseDto> CreateTicketAsync(
        TicketCreateDto dto,
        Guid createdBy,
        CancellationToken cancellationToken = default)
    {
        var category = await _db.TicketCategories
            .AsNoTracking()
            .Where(item =>
                item.Id == dto.CategoryId &&
                item.IsActive)
            .Select(item => new
            {
                item.Id,
                item.DefaultTeamId,
                HasActiveDefaultTeam =
                    item.DefaultTeam != null && item.DefaultTeam.IsActive
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (category is null)
            throw new ArgumentException("Selected category was not found.");

        if (!category.DefaultTeamId.HasValue ||
            !category.HasActiveDefaultTeam)
        {
            throw new InvalidOperationException(
                "The selected category is not assigned to an active support team.");
        }

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

        
        var initialStatus = await _db.TicketStatuses.SingleOrDefaultAsync(
            s => s.IsActive && s.IsInitial,
            cancellationToken)
            ?? throw new InvalidOperationException(
                "No active initial status was found.");

        var inProgressStatus = await _db.TicketStatuses.SingleOrDefaultAsync(
            s => s.IsActive && s.Name == "In Progress",
            cancellationToken)
            ?? throw new InvalidOperationException(
                "The active In Progress status was not found.");

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
            TeamId = category.DefaultTeamId,
            CategoryId = dto.CategoryId,
            SubcategoryId = dto.SubcategoryId,
            StatusId = inProgressStatus.Id,
            PriorityId = dto.PriorityId,
            ImpactLevelId = dto.ImpactLevelId,
            UrgencyLevelId = dto.UrgencyLevelId,
            CreatedAt = DateTime.UtcNow
        };

        _db.Tickets.Add(ticket);
        await _slaService.StartSlaAsync(
            ticket,
            cancellationToken);

        _db.TicketHistories.Add(new Entities.TicketHistory
        {
            TicketId = ticket.Id,
            ActionType = Entities.TicketHistoryActionType.StatusChanged,
            FieldName = "Status",
            OldValue = initialStatus.Name,
            NewValue = inProgressStatus.Name,
            Description =
                "Automatically changed because the ticket was assigned to a team.",
            ChangedById = createdBy,
            ChangedAt = ticket.CreatedAt
        });
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

        var response = await _db.Tickets
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

        await _notificationService.NotifyTeamLeadersOfNewTicketAsync(
            ticket.Id,
            createdBy,
            cancellationToken);

        return response;
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
        if (!await CanAccessTicketAsync(
                ticketId,
                changedByUserId,
                currentUserRole,
                cancellationToken))
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

        if (!await CanAccessTicketAsync(
                ticketId,
                deletedById,
                currentUserRole,
                cancellationToken))
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

    private static string GetSlaStatus(
        DateTime dueAt,
        DateTime? completedAt,
        DateTime now)
    {
        if (completedAt.HasValue)
            return completedAt.Value <= dueAt ? "Met" : "Breached";

        return now <= dueAt ? "Pending" : "Breached";
    }

    private IQueryable<Entities.Ticket> ApplyAccessScope(
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
            Roles.TeamLeader => query.Where(ticket =>
                ticket.TeamId.HasValue &&
                _db.TeamMembers.Any(teamMember =>
                    teamMember.UserId == currentUserId &&
                    teamMember.TeamId == ticket.TeamId.Value &&
                    teamMember.RoleInTeam == Entities.TeamMemberRole.TeamLeader &&
                    teamMember.IsActive &&
                    teamMember.Team.IsActive &&
                    teamMember.User.IsActive)),
            Roles.User => query.Where(ticket =>
                ticket.CreatedById == currentUserId),
            _ => query.Where(_ => false)
        };
    }

}
