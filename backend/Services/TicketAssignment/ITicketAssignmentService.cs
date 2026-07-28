using backend.DTO.Ticket;

namespace backend.Services.TicketAssignment;

public interface ITicketAssignmentService
{
    Task<TicketAssignmentResponseDto> AssignTicketAsync(TicketAssignmentCreateDto createDto, TicketAssignmentDto assignmentDto);
    Task<List<TicketAssignmentResponseDto>> GetAssignmentsByTicketIdAsync(Guid ticketId);
    Task<List<TicketAssignmentResponseDto>> GetMyAssignedTicketsAsync(Guid teamMemberId);
}