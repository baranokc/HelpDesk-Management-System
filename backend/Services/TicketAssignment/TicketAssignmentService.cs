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
    
    public async Task<TicketAssignmentResponseDto?> AssignTicketAsync(TicketAssignmentCreateDto createDto, TicketAssignmentDto assignmentDto)
    {
        var ticket = await _context.Tickets.FindAsync(createDto.TicketId);
        if (ticket == null) return null;

        var team = await _context.Teams.FindAsync(assignmentDto.TeamId);
        if (team == null) return null;

        var assignedBy = await _context.TeamMembers
            .Include(tm => tm.User)
            .FirstOrDefaultAsync(tm => tm.Id == createDto.AssignedById && tm.IsActive);

        if (assignedBy == null) return null;

        Guid targetAssignedToId = assignmentDto.TeamMemberId ?? assignedBy.Id;

        var assignedTo = await _context.TeamMembers
            .Include(tm => tm.User)
            .FirstOrDefaultAsync(tm => tm.Id == targetAssignedToId && tm.TeamId == assignmentDto.TeamId && tm.IsActive);

        if (assignedTo == null) return null!;

        var assignment = new Entities.TicketAssignment
        {
            Id = Guid.NewGuid(),
            TicketId = createDto.TicketId,
            TeamId = assignmentDto.TeamId,
            AssignedToId = targetAssignedToId,
            AssignedById = assignedBy.Id,
            AssignedAt = DateTime.UtcNow
        };
        ticket.TeamId = team.Id;
        ticket.AssignedToId = assignedTo.UserId;
        
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

    public async Task<List<TicketAssignmentResponseDto>>
        GetAssignmentsByTicketIdAsync(Guid ticketId)
    {
        return await _context.TicketAssignments
            .AsNoTracking()
            .Where(x => x.TicketId == ticketId)
            .OrderByDescending(x => x.AssignedAt)
            .Select(x => new TicketAssignmentResponseDto
            {
                Id = x.Id,
                TicketId = x.TicketId,
                TeamId = x.TeamId,
                TeamName = x.Team.Name,
                TeamMemberId = x.AssignedToId,
                TeamMemberName =
                    x.AssignedToTeamMember.User.Name + " " +
                    x.AssignedToTeamMember.User.LastName,
                AssignedById = x.AssignedById,
                AssignedByName =
                    x.AssignedByTeamMember.User.Name + " " +
                    x.AssignedByTeamMember.User.LastName,
                AssignedAt = x.AssignedAt
            })
            .ToListAsync();
    }

    public async Task<List<TicketAssignmentResponseDto>>
        GetMyAssignedTicketsAsync(Guid teamMemberId)
    {
        return await _context.TicketAssignments
            .AsNoTracking()
            .Where(x => x.AssignedToId == teamMemberId)
            .OrderByDescending(x => x.AssignedAt)
            .Select(x => new TicketAssignmentResponseDto
            {
                Id = x.Id,
                TicketId = x.TicketId,
                TeamId = x.TeamId,
                TeamName = x.Team.Name,
                TeamMemberId = x.AssignedToId,
                TeamMemberName =
                    x.AssignedToTeamMember.User.Name + " " +
                    x.AssignedToTeamMember.User.LastName,
                AssignedById = x.AssignedById,
                AssignedByName =
                    x.AssignedByTeamMember.User.Name + " " +
                    x.AssignedByTeamMember.User.LastName,
                AssignedAt = x.AssignedAt
            })
            .ToListAsync();
    }
}