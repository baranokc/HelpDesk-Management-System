using System.Security.AccessControl;
using backend.Data;
using backend.DTO.Common;
using backend.DTO.Ticket;
using backend.Entities;
using backend.Services.Ticket;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class TicketService : ITicketService
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _enviroment;
    
    public TicketService(AppDbContext db, IWebHostEnvironment enviroment)
    {
        _db = db;
        _enviroment = enviroment;
    }

    public async Task<PagedResultDto<TicketListDto>> GetTicketAsync (
        TicketFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var query = _db.Tickets.AsNoTracking().Where(t => !t.IsDeleted);
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(t => t.TicketNumber.ToLower().Contains(search) || 
            t.TicketTitle.ToLower().Contains(search) || 
            t.Subject.ToLower().Contains(search) || 
            t.TicketDescription.ToLower().Contains(search));
        }

        if(filter.StatusId.HasValue) query = query.Where(t => t.StatusId == filter.StatusId.Value);
        if(filter.CategoryId.HasValue) query = query.Where(t => t.CategoryId == filter.CategoryId.Value);
        if(filter.AssignedToId.HasValue) query = query.Where(t => t.AssignedToId == filter.AssignedToId.Value);
        if(filter.CreatedById.HasValue) query = query.Where(t => t.CreatedById == filter.CreatedById.Value);
        if(filter.UrgencyLevelId.HasValue) query = query.Where(t => t.UrgencyLevelId == filter.UrgencyLevelId.Value);
        if(filter.ImpactLevelId.HasValue) query = query.Where(t => t.ImpactLevelId == filter.ImpactLevelId.Value);
        if(filter.CreatedFrom.HasValue) query = query.Where(t => t.CreatedAt == filter.CreatedFrom.Value);
        if(filter.CreatedTo.HasValue) query = query.Where(t => t.CreatedAt == filter.CreatedTo.Value);


        var pageNumber = Math.Max(filter.PageNumber, 1);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);
        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((pageNumber- 1)*pageSize)
            .Take(pageSize)
            .Select(t => new TicketListDto{
                Id = t.Id,
                TicketNumber = t.TicketNumber,
                TicketTitle = t.TicketTitle,
                StatusName = t.Status.Name,
                PriorityName = t.Priority.Name,
                CategoryName = t.Category.Name,
                SubcategoryName = t.Subcategory != null ? t.Subcategory.Name : null,
                CreatedByName = t.CreatedBy.Name + " " + t.CreatedBy.LastName,
                AssignedToName = t.AssignedTo!= null? t.AssignedTo.Name + " " + t.AssignedTo.LastName : null,
                CreatedAt = t.CreatedAt}).ToListAsync(cancellationToken);

        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        return new PagedResultDto<TicketListDto>(items, pageNumber, pageSize, totalCount, totalPages);
    }

    public async Task<TicketDetailDto?> GetTicketByAsync (Guid ticketId, CancellationToken cancellationToken = default)
    {
        var ticket =  await _db.Tickets
            .Include(t => t.CreatedBy)
            .Include(t => t.AssignedTo)
            .Include(t => t.Team)
            .Include(t => t.Status)
            .Include(t => t.Priority)
            .Include(t => t.Category)
            .Include(t => t.Comments).ThenInclude(c => c.User)
            .FirstOrDefaultAsync(t => t.Id == ticketId && !t.IsDeleted, cancellationToken);
        
        if (ticket is null ) return null;

        return new TicketDetailDto
        {
            Id = ticket.Id,
            TicketNumber = ticket.TicketNumber,
            TicketTitle = ticket.TicketTitle,
            TicketDescription = ticket.TicketDescription,
            Subject = ticket.Subject,
            StatusName = ticket.Status.Name,
            PriorityName = ticket.Priority.Name,
            CategoryName = ticket.Category.Name,
            CreatedByName = $"{ticket.CreatedBy.Name} {ticket.CreatedBy.LastName}",
            AssignedToName = ticket.AssignedTo != null ? $"{ticket.AssignedTo.Name} {ticket.AssignedTo.LastName}" : null,
            CreatedAt = ticket.CreatedAt
        };
    }

    public async Task<TicketResponseDto> CreateTicketAsync(TicketCreateDto dto, Guid createdBy, CancellationToken cancellationToken = default)
    {
        var initialStatus = await _db.TicketStatuses.FirstOrDefaultAsync(s => s.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("No active initial state found.");
        
        var rawSeqValue = await _db.Database
            .SqlQueryRaw<long>("SELECT nextval('\"TicketNumberSequence\"') AS \"Value\"")
            .FirstOrDefaultAsync(cancellationToken);

        string formattedTicketNumber = rawSeqValue.ToString("D8");

        var ticket = new Entities.Ticket{
            TicketNumber = $"HD-{formattedTicketNumber}",
            TicketTitle = dto.TicketTitle.Trim(),
            TicketDescription = dto.TicketDescription.Trim(),
            Subject = dto.Subject,
            CreatedById = createdBy,
            CategoryId = dto.CategoryId,
            SubcategoryId = dto.SubcategoryId,
            StatusId = initialStatus.Id,
            PriorityId = dto.PriorityId,
            ImpactLevelId = dto.ImpactLevelId,
            UrgencyLevelId = dto.UrgencyLevelId,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Tickets.Add(ticket);
        await _db.SaveChangesAsync(cancellationToken);

        return new TicketResponseDto
        {
            Id = ticket.Id,
            TicketTitle = ticket.TicketTitle,
            Subject = ticket.Subject,
            CreatedAt = ticket.CreatedAt
        };
    }

    public async Task<TicketResponseDto?> UpdateTicketAsync(Guid ticketId, TicketUpdateDto dto, Guid assignedByUserId, CancellationToken cancellationToken = default)
    {
        var ticket = await _db.Tickets.FirstOrDefaultAsync(t => t.Id == ticketId && !t.IsDeleted, cancellationToken);
        if (ticket is null ) return null;

        ticket.TicketTitle = dto.TicketTitle.Trim();
        ticket.TicketDescription = dto.TicketDescription.Trim();
        ticket.Subject = dto.Subject.Trim();
        ticket.CategoryId = dto.CategoryId;
        ticket.SubcategoryId = dto.SubcategoryId;
        ticket.PriorityId = dto.PriorityId;
        ticket.ImpactLevelId = dto.ImpactLevelId;
        ticket.UrgencyLevelId = dto.UrgencyLevelId;

        await _db.SaveChangesAsync(cancellationToken);

        return new TicketResponseDto
        {
            Id = ticket.Id,
            TicketTitle = ticket.TicketTitle,
            TicketDescription = ticket.TicketDescription,
            Subject = ticket.Subject,
            CreatedAt = ticket.CreatedAt,
        };
    }

    public async Task<bool> UpdateAsync(Guid ticketId, TicketAssignmentDto dto, Guid changedById, CancellationToken cancellationToken = default)
    {
        var ticket = await _db.Tickets.FirstOrDefaultAsync(t => t.Id == ticketId && !t.IsDeleted, cancellationToken);
        if( ticket is null) return false;

        ticket.TeamId = dto.TeamId;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

public async Task<TicketAssignmentResponseDto?> AssignTicketAsync(Guid ticketId, TicketAssignmentDto dto, Guid assignedByUserId, CancellationToken cancellationToken = default)
{
    var ticket = await _db.Tickets
        .FirstOrDefaultAsync(
            t => t.Id == ticketId,
            cancellationToken);

    if (ticket is null) return null;

    var assignedByTeamMember = await _db.TeamMembers
        .Include(tm => tm.User)
        .FirstOrDefaultAsync(
            tm =>
                tm.UserId == assignedByUserId &&
                tm.IsActive,
            cancellationToken);

    if (assignedByTeamMember is null) throw new InvalidOperationException("The user who made the assignment is not an active team member.");

    var team = await _db.Teams.FirstOrDefaultAsync(t => t.Id == dto.TeamId, cancellationToken);

    if (team is null) throw new KeyNotFoundException("No team was found to assign to..");
    
    TeamMember? assignedTeamMember = null;

    if (dto.TeamMemberId.HasValue)
    {
        assignedTeamMember = await _db.TeamMembers
            .Include(tm => tm.User)
            .FirstOrDefaultAsync(
                tm =>
                    tm.Id == dto.TeamMemberId.Value &&
                    tm.TeamId == dto.TeamId &&
                    tm.IsActive,
                cancellationToken);

        if (assignedTeamMember is null) throw new KeyNotFoundException("No active team member could be assigned " + "or the user does not belong to the selected team.");
        
    }

    ticket.TeamId = dto.TeamId;
    ticket.AssignedToId = assignedTeamMember?.UserId;

    TicketAssignment? assignment = null;

    if (assignedTeamMember is not null)
    {
        assignment = new TicketAssignment
        {
            TicketId = ticket.Id,
            TeamId = dto.TeamId,
            AssignedToId = assignedTeamMember.Id,
            AssignedById = assignedByTeamMember.Id,
            AssignedAt = DateTime.UtcNow
        };

        _db.TicketAssignments.Add(assignment);
    }

    await _db.SaveChangesAsync(cancellationToken);

    return new TicketAssignmentResponseDto
    {
        Id = assignment?.Id ?? Guid.Empty,
        TicketId = ticket.Id,
        TeamId = team.Id,
        TeamName = team.Name,
        TeamMemberId = assignedTeamMember?.Id,
        TeamMemberName = assignedTeamMember is null ? null : $"{assignedTeamMember.User.Name} " + $"{assignedTeamMember.User.LastName}",
        AssignedById = assignedByTeamMember.Id,
        AssignedByName = $"{assignedByTeamMember.User.Name} " + $"{assignedByTeamMember.User.LastName}",
        AssignedAt = assignment?.AssignedAt ?? DateTime.UtcNow,
        Note = dto.Reason
    };
}

    public async Task<bool> UnassignTicketAsync(Guid ticketId, TicketAssignmentDto dto, Guid changedById, CancellationToken cancellationToken = default)
    {
        var ticket = await _db.Tickets.FirstOrDefaultAsync(t => t.Id == ticketId && !t.IsDeleted, cancellationToken);
        if (ticket is null) return false;

        ticket.AssignedToId = null;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

public async Task<TicketCommentDto?> AddCommentAsync(Guid ticketId, TicketCommentCreateDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var comment = new TicketComment
        {
            TicketId = ticketId,
            UserId = userId,
            Comment = dto.Comment.Trim(),
            IsInternal = dto.IsInternal,
            CreatedAt = DateTime.UtcNow,
        };

        _db.TicketComments.Add(comment);
        await _db.SaveChangesAsync(cancellationToken);

        return new TicketCommentDto
        {
            Id = comment.Id,
            Comment = comment.Comment,
            CreatedById = userId,
            CreatedAt = comment.CreatedAt,
        };
    }

    public async Task<IReadOnlyCollection<TicketAttachmentDto>> AddAttachmentAsync(Guid ticketId, TicketAttachmentCreateDto dto, Guid uploaderId, CancellationToken cancellationToken = default)
    {
        var ticket = await _db.Tickets.FirstOrDefaultAsync(t => t.Id == ticketId && !t.IsDeleted, cancellationToken);
        if( ticket is null || dto.Files == null || !dto.Files.Any()) return Array.Empty<TicketAttachmentDto>();

        var uploadsFolder = Path.Combine(_enviroment.ContentRootPath, "uploads");
        if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

        var result = new List<TicketAttachmentDto>();

        foreach (var file in dto.Files)
        {
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            var attachment = new TicketAttachment
            {
              TicketId = ticketId,
              TicketCommentId = dto.CommentId,
              FileName = file.FileName,
              FilePath = filePath,
              ContentType = file.ContentType,
              FileSize = file.Length,
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
                DownloadUrl = $"/uploads/{uniqueFileName}",
                UploadedById = uploaderId,
                UploadedAt = attachment.UploadedAt
            });
        }

        await _db.SaveChangesAsync(cancellationToken);
        return result;
    }

    public async Task<bool> ResolveTicketAsync(Guid ticketId, TicketResolveDto dto, Guid resolvedById, CancellationToken cancellationToken = default)
    {
        var ticket = await _db.Tickets.FirstOrDefaultAsync(t => t.Id == ticketId && !t.IsDeleted, cancellationToken);
        if (ticket is null ) return false;
        if (ticket.ResolvedAt.HasValue) throw new InvalidOperationException("Ticket has been already resolved.");

        ticket.Resolution = dto.Resolution;
        ticket.ResolvedById = resolvedById;
        ticket.ResolvedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }


    public async Task<IReadOnlyCollection<TicketHistoryDto>> GetHistoryAsync(Guid ticketId, CancellationToken cancellationToken = default)
    {
        return await _db.Set<TicketHistory>()
            .AsNoTracking()
            .Where(h => h.TicketId == ticketId)
            .OrderByDescending(h => h.ChangedAt)
            .Select(h => new TicketHistoryDto
            {
                Id = h.Id,
                TicketId = h.TicketId,
                ActionType = h.ActionType,
                FieldName = h.FieldName,
                OldValue = h.OldValue,
                NewValue = h.NewValue,
                ChangedById = h.ChangedById,
                ChangedAt = h.ChangedAt,
            }).ToListAsync(cancellationToken);
    }

    public async Task<bool> DeleteTicketAsync(Guid ticketId, Guid deletedById, CancellationToken cancellationToken = default)
    {
        var ticket = await _db.Tickets.FirstOrDefaultAsync(t => t.Id == ticketId && !t.IsDeleted, cancellationToken);
        if (ticket is null) return false;

        ticket.IsDeleted = true;
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}