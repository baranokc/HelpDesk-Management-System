using backend.Constants;
using backend.Data;
using backend.DTO.Ticket;
using backend.Entities;
using Microsoft.EntityFrameworkCore;
using backend.Services.Notification;


namespace backend.Services.TicketAssignment;

public class TicketAssignmentService : ITicketAssignmentService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public TicketAssignmentService(
        AppDbContext context,
        INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }
    
    public async Task<TicketAssignmentResponseDto?> AssignTicketAsync(
        TicketAssignmentCreateDto createDto,
        TicketAssignmentDto assignmentDto,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var ticket = await _context.Tickets
            .Include(x => x.AssignedTo)
            .Include(x => x.Team)
            .FirstOrDefaultAsync(
                x => x.Id == createDto.TicketId &&
                    !x.IsDeleted,
                cancellationToken);

        if (ticket is null)
        {
            throw new ArgumentException(
                "Ticket was not found.");
        }

        var team = await _context.Teams
            .FirstOrDefaultAsync(
                x => x.Id == assignmentDto.TeamId &&
                    x.IsActive,
                cancellationToken);

        if (team is null)
        {
            throw new ArgumentException(
                "Team was not found or is inactive.");
        }

        if (currentUserRole == Roles.TeamLeader &&
            ticket.TeamId != assignmentDto.TeamId)
        {
            throw new UnauthorizedAccessException(
                "Team leaders can assign tickets only within the ticket's current team.");
        }

        var assignedByQuery = _context.TeamMembers
            .Include(tm => tm.User)
            .Where(tm =>
                tm.UserId == createDto.AssignedById &&
                tm.IsActive &&
                tm.User.IsActive);

        if (currentUserRole == Roles.TeamLeader)
        {
            assignedByQuery = assignedByQuery.Where(tm =>
                tm.TeamId == assignmentDto.TeamId &&
                tm.RoleInTeam == TeamMemberRole.TeamLeader);
        }
        else
        {
            assignedByQuery = assignedByQuery
                .OrderByDescending(tm => tm.TeamId == assignmentDto.TeamId);
        }

        var assignedBy = await assignedByQuery.FirstOrDefaultAsync(
            cancellationToken);

        if (assignedBy is null)
        {
            if (currentUserRole == Roles.TeamLeader)
            {
                throw new UnauthorizedAccessException(
                    "You are not an active leader of the selected team.");
            }

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
                    tm.User.IsActive,
                cancellationToken);

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

        await _context.TicketAssignments.AddAsync(
            assignment,
            cancellationToken);
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

        await _context.SaveChangesAsync(cancellationToken);

        await _notificationService.NotifyTicketAssignedAsync(
            ticket.Id,
            assignedTo.UserId,
            createDto.AssignedById,
            cancellationToken);

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
