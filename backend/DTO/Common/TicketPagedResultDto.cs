using backend.DTO.Common;

namespace backend.DTO.Ticket;

public sealed class TicketPagedResultDto : PagedResultDto<TicketListDto>
{
    public int OpenCount { get; set; }
    public int InProgressCount { get; set; }
    public int CompletedCount { get; set; }

    public TicketPagedResultDto(
        List<TicketListDto> items,
        int pageNumber,
        int pageSize,
        int totalCount,
        int totalPages,
        int openCount,
        int inProgressCount,
        int completedCount)
        : base(items, pageNumber, pageSize, totalCount, totalPages)
    {
        OpenCount = openCount;
        InProgressCount = inProgressCount;
        CompletedCount = completedCount;
    }
}