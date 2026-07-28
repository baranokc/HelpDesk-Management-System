using backend.Data;
using backend.DTO.Ticket;
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
            .FirstOrDefaultAsync(
                t => t.Id == ticketId && !t.IsDeleted,
                cancellationToken);

        if (ticket is null)
            return false;

        if (ticket.ResolvedAt.HasValue)
            throw new InvalidOperationException("Ticket has already been resolved.");

        if (dto.ResolutionCategoryId.HasValue)
        {
            var categoryExists = await _db.Set<Entities.ResolutionCategory>()
                .AnyAsync(
                    c => c.Id == dto.ResolutionCategoryId.Value,
                    cancellationToken);

            if (!categoryExists)
                throw new InvalidOperationException("Resolution category was not found.");
        }

        ticket.Resolution = dto.Resolution.Trim();
        ticket.ResolutionCategoryId = dto.ResolutionCategoryId;
        ticket.ResolvedById = resolvedById;
        ticket.ResolvedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(dto.InternalNote))
        {
            _db.TicketComments.Add(new Entities.TicketComment
            {
                TicketId = ticketId,
                UserId = resolvedById,
                Comment = dto.InternalNote.Trim(),
                IsInternal = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
