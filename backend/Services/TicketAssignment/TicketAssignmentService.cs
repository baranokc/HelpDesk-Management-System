using System.Net;
using backend.Data;
using backend.DTO.Ticket;
using Microsoft.EntityFrameworkCore;


namespace backend.Services.TicketAssignment;

public class TicketAssignmentService : ITicketAssignmentService
{
    private readonly AppDbContext _context;

    public TicketAssignmentService(AppDbContext context)
    {
        _context = context;
    }
    public async Task<TicketAssignmentResponseDto> AssignTicketAsync(TicketAssignmentCreateDto createDto, TicketAssignmentDto assignmentDto)
    {
        var ticket = await _context.Tickets.FindAsync(createDto.TicketId);
        if (ticket == null) return null!;

        var team = await _context.Teams.FindAsync(assignmentDto.TeamId);
        if (team == null) return null!;

        var assignedBy = await _context.TeamMembers
            .Include(tm => tm.User)
            .FirstOrDefaultAsync(tm => tm.Id == createDto.AssignedById);

        if (assignedBy == null) return null!;

        Guid targetAssignedToId = assignmentDto.TeamMemberId ?? createDto.AssignedById;

        var assignedTo = await _context.TeamMembers
            .Include(tm => tm.User)
            .FirstOrDefaultAsync(tm => tm.Id == targetAssignedToId);

        if (assignedTo == null) return null!;

        var assignment = new Entities.TicketAssignment
        {
            Id = Guid.NewGuid(),
            TicketId = createDto.TicketId,
            TeamId = assignmentDto.TeamId,
            AssignedToId = targetAssignedToId,
            AssignedById = createDto.AssignedById,
            AssignedAt = DateTime.UtcNow
        };
        await _context.TicketAssignments.AddAsync(assignment);
        await _context.SaveChangesAsync();

        return new TicketAssignmentResponseDto
        {
            Id = assignment.Id,
            TicketId = assignment.TicketId,
            TeamId = assignment.TeamId,
            TeamName = team.Name,
            TeamMemberId = assignment.AssignedToId,
            TeamMemberName = $"{assignedTo.User.Name} {assignedTo.User.LastName}",
            AssignedById = assignment.AssignedById,
            AssignedByName = $"{assignedBy.User.Name} {assignedBy.User.LastName}",
            AssignedAt = assignment.AssignedAt,
            Note = createDto.Note

        };
    }

    public Task<List<TicketAssignmentResponseDto>> GetAssignmentsByTicketIdAsync(Guid ticketId)
    {
        throw new NotImplementedException();
    }

    public Task<List<TicketAssignmentResponseDto>> GetMyAssignedTicketsAsync(Guid teamMemberId)
    {
        throw new NotImplementedException();
    }
}