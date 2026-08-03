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
    
    public async Task<TicketAssignmentResponseDto?> AssignTicketAsync(
    TicketAssignmentCreateDto createDto,
    TicketAssignmentDto assignmentDto)
    {
        var ticket = await _context.Tickets
            .Include(x => x.AssignedTo)
            .Include(x => x.Team)
            .FirstOrDefaultAsync(
                x => x.Id == createDto.TicketId &&
                    !x.IsDeleted);

        if (ticket is null)
        {
            throw new ArgumentException(
                "Ticket was not found.");
        }

        var team = await _context.Teams
            .FirstOrDefaultAsync(
                x => x.Id == assignmentDto.TeamId &&
                    x.IsActive);

        if (team is null)
        {
            throw new ArgumentException(
                "Team was not found or is inactive.");
        }

        var assignedBy = await _context.TeamMembers
            .Include(tm => tm.User)
            .FirstOrDefaultAsync(
                tm =>
                    tm.UserId == createDto.AssignedById &&
                    tm.IsActive &&
                    tm.User.IsActive);

        if (assignedBy is null)
        {
            throw new ArgumentException(
                "The logged-in user is not an active team member.");
        }

        var targetAssignedToId =
            assignmentDto.TeamMemberId ?? assignedBy.Id;

        var assignedTo = await _context.TeamMembers
            .Include(tm => tm.User)
            .FirstOrDefaultAsync(
                tm =>
                    tm.Id == targetAssignedToId &&
                    tm.TeamId == assignmentDto.TeamId &&
                    tm.IsActive &&
                    tm.User.IsActive);

        if (assignedTo is null)
        {
            throw new ArgumentException(
                "The selected team member was not found or does not belong to the selected team.");
        }

        var changedAt = DateTime.UtcNow;
        var oldAssignment = ticket.AssignedTo is not null
            ? $"{ticket.AssignedTo.Name} {ticket.AssignedTo.LastName}"
            : ticket.Team?.Name ?? "Unassigned";

        var newAssignment =
            $"{team.Name} / {assignedTo.User.Name} {assignedTo.User.LastName}";

        var assignment = new Entities.TicketAssignment
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            TeamId = team.Id,
            AssignedToId = assignedTo.Id,
            AssignedById = assignedBy.Id,
            AssignedAt = changedAt
        };

        ticket.TeamId = team.Id;
        ticket.AssignedToId = assignedTo.UserId;

        await _context.TicketAssignments.AddAsync(assignment);
        _context.TicketHistories.Add(new Entities.TicketHistory
        {
            TicketId = ticket.Id,
            ActionType = Entities.TicketHistoryActionType.Assigned,
            FieldName = "Assignment",
            OldValue = oldAssignment,
            NewValue = newAssignment,
            Description = string.IsNullOrWhiteSpace(assignmentDto.Reason ?? createDto.Note)
                ? null
                : (assignmentDto.Reason ?? createDto.Note)!.Trim(),
            ChangedById = createDto.AssignedById,
            ChangedAt = changedAt
        });

        await _context.SaveChangesAsync();

        return new TicketAssignmentResponseDto
        {
            Id = assignment.Id,
            TicketId = ticket.Id,
            TeamId = team.Id,
            TeamName = team.Name,
            TeamMemberId = assignedTo.Id,
            TeamMemberName =
                $"{assignedTo.User.Name} {assignedTo.User.LastName}",
            AssignedById = assignedBy.Id,
            AssignedByName =
                $"{assignedBy.User.Name} {assignedBy.User.LastName}",

            AssignedAt = assignment.AssignedAt,
            Note = assignmentDto.Reason ?? createDto.Note
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
