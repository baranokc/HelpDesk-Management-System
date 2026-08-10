using backend.Data;
using backend.DTO.Ticket;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.TicketHistory;

public class TicketHistoryService : ITicketHistoryService
{
    private readonly AppDbContext _db;

    public TicketHistoryService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyCollection<TicketHistoryDto>> GetHistoryAsync(
        Guid ticketId,
        bool includeStaffDetails,
        CancellationToken cancellationToken = default)
    {
        return await _db.TicketHistories
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
                AvatarFileName = h.ChangedBy != null ? h.ChangedBy.AvatarFileName : null,
                Description = includeStaffDetails ||
                    (h.ActionType != Entities.TicketHistoryActionType.Assigned &&
                     h.ActionType != Entities.TicketHistoryActionType.Unassigned)
                    ? h.Description
                    : null,
                ChangedById = h.ChangedById,
                ChangedByName = h.ChangedBy.Name == null ? "System" :(h.ChangedBy.Name + " " + h.ChangedBy.LastName).Trim(),
                ChangedAt = h.ChangedAt
            })
            .ToListAsync(cancellationToken);
    }
}
