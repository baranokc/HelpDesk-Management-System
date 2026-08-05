using backend.Data;
using backend.DTO.Ticket;
using backend.Entities;
using backend.Services.Notification;
using backend.Services.Sla;
using Microsoft.EntityFrameworkCore;
namespace backend.Services.TicketResolution;

public class TicketResolutionService : ITicketResolutionService
{
    private readonly AppDbContext _db;
    private readonly ISlaService _slaService;
    private readonly INotificationService _notificationService;

    public TicketResolutionService(
        AppDbContext db,
        ISlaService slaService,
        INotificationService notificationService)
    {
        _db = db;
        _slaService = slaService;
        _notificationService = notificationService;
    }

    public async Task<bool> ResolveTicketAsync(
        Guid ticketId,
        TicketResolveDto dto,
        Guid resolvedById,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _db.Tickets
            .Include(t => t.Status)
            .FirstOrDefaultAsync(
                t => t.Id == ticketId && !t.IsDeleted,
                cancellationToken);

        if (ticket is null)
            return false;

        if (ticket.Status.IsClosed)
        {
            throw new InvalidOperationException(
                "A closed or cancelled ticket cannot be resolved.");
        }

        if (ticket.ResolvedAt.HasValue)
        {
            throw new InvalidOperationException(
                "Ticket has already been resolved.");
        }

        var resolvedStatus = await _db.TicketStatuses
            .SingleOrDefaultAsync(
                status =>
                    status.Name == "Resolved" &&
                    status.IsActive,
                cancellationToken)
            ?? throw new InvalidOperationException(
                "The active Resolved status was not found.");

        if (dto.ResolutionCategoryId.HasValue)
        {
            var categoryExists =
                await _db.ResolutionCategories.AnyAsync(
                    category =>
                        category.Id ==
                            dto.ResolutionCategoryId.Value &&
                        category.IsActive,
                    cancellationToken);

            if (!categoryExists)
            {
                throw new InvalidOperationException(
                    "Resolution category was not found.");
            }
        }

        var resolvedAt = DateTime.UtcNow;
        var oldStatusName = ticket.Status.Name;

        ticket.Resolution = dto.Resolution.Trim();
        ticket.ResolutionCategoryId =
            dto.ResolutionCategoryId;
        ticket.ResolvedById = resolvedById;
        ticket.ResolvedAt = resolvedAt;
        ticket.StatusId = resolvedStatus.Id;

        await _slaService.CompleteResolutionAsync(
            ticket,
            resolvedAt,
            cancellationToken);

        _db.TicketHistories.Add(new backend.Entities.TicketHistory
        {
            TicketId = ticket.Id,
            ActionType = TicketHistoryActionType.Resolved,
            FieldName = "Status",
            OldValue = oldStatusName,
            NewValue = resolvedStatus.Name,
            Description = dto.Resolution.Trim(),
            ChangedById = resolvedById,
            ChangedAt = resolvedAt
        });

        if (!string.IsNullOrWhiteSpace(dto.InternalNote))
        {
            var comment = new backend.Entities.TicketComment
            {
                TicketId = ticketId,
                UserId = resolvedById,
                Comment = dto.InternalNote.Trim(),
                IsInternal = true,
                CreatedAt = resolvedAt
            };

            _db.TicketComments.Add(comment);
        }

        await _db.SaveChangesAsync(cancellationToken);
        await _notificationService.NotifyTicketResolvedAsync(
            ticket.Id,
            resolvedById,
            cancellationToken);

        return true;
    }

    public async Task<bool> CloseTicketAsync(
        Guid ticketId,
        Guid closedById,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _db.Tickets
            .Include(item => item.Status)
            .FirstOrDefaultAsync(
                item => item.Id == ticketId && !item.IsDeleted,
                cancellationToken);

        if (ticket is null)
            return false;

        if (ticket.ClosedAt.HasValue)
        {
            throw new InvalidOperationException(
                "Ticket has already been closed.");
        }

        if (!ticket.ResolvedAt.HasValue ||
            !ticket.Status.Name.Equals(
                "Resolved",
                StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Only a resolved ticket can be closed.");
        }

        var closedStatus = await _db.TicketStatuses
            .SingleOrDefaultAsync(
                status =>
                    status.Name == "Closed" &&
                    status.IsActive,
                cancellationToken)
            ?? throw new InvalidOperationException(
                "The active Closed status was not found.");

        var closedAt = DateTime.UtcNow;
        var oldStatusName = ticket.Status.Name;

        ticket.StatusId = closedStatus.Id;
        ticket.ClosedAt = closedAt;

        _db.TicketHistories.Add(new backend.Entities.TicketHistory
        {
            TicketId = ticket.Id,
            ActionType = TicketHistoryActionType.Closed,
            FieldName = "Status",
            OldValue = oldStatusName,
            NewValue = closedStatus.Name,
            Description = "Ticket closed after resolution.",
            ChangedById = closedById,
            ChangedAt = closedAt
        });

        await _db.SaveChangesAsync(cancellationToken);
        await _notificationService.NotifyTicketClosedAsync(
            ticket.Id,
            closedById,
            cancellationToken);

        return true;
    }
}
