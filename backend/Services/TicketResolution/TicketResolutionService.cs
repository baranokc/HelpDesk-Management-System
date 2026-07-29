using backend.Data;
using backend.DTO.Ticket;
using backend.Entities;
using Microsoft.EntityFrameworkCore;
namespace backend.Services.TicketResolution;

public class TicketResolutionService : ITicketResolutionService
{
    private readonly AppDbContext _db;

    public TicketResolutionService(AppDbContext db)
    {
        _db = db;
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
        }

        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
