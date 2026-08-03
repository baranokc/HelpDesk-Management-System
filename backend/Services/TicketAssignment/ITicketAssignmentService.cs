using backend.DTO.Ticket;

namespace backend.Services.TicketAssignment;

public interface ITicketAssignmentService
{
    Task<TicketAssignmentResponseDto?> AssignTicketAsync(TicketAssignmentCreateDto createDto, TicketAssignmentDto assignmentDto, string currentUserRole, CancellationToken cancellationToken = default);
    Task<List<TicketAssignmentResponseDto>> GetAssignmentsByTicketIdAsync(Guid ticketId);
    Task<List<TicketAssignmentResponseDto>> GetMyAssignedTicketsAsync(Guid teamMemberId);
}
