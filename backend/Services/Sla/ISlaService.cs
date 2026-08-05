using SlaRecordEntity = global::backend.Entities.SlaRecord;
using TicketEntity = global::backend.Entities.Ticket;

namespace backend.Services.Sla;

public interface ISlaService
{
    Task<SlaRecordEntity> StartSlaAsync(
        TicketEntity ticket,
        CancellationToken cancellationToken = default);

    Task<bool> MarkFirstResponseAsync(
        TicketEntity ticket,
        DateTime respondedAt,
        CancellationToken cancellationToken = default);

    Task<bool> CompleteResolutionAsync(
        TicketEntity ticket,
        DateTime resolvedAt,
        CancellationToken cancellationToken = default);
}
