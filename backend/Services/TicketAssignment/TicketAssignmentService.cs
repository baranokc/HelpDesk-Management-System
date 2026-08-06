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
            .Include(x => x.Status)
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

        var sourceTeamId = ticket.TeamId;
        var isCrossTeamTransfer =
            sourceTeamId.HasValue && sourceTeamId.Value != team.Id;

        var assignedByQuery = _context.TeamMembers
            .Include(tm => tm.User)
            .Where(tm =>
                tm.UserId == createDto.AssignedById &&
                tm.IsActive &&
                tm.User.IsActive &&
                tm.User.UserRoles.Any(userRole =>
                    userRole.Role.IsActive &&
                    (userRole.Role.Name == Roles.Admin ||
                     userRole.Role.Name == Roles.SupportAgent ||
                     userRole.Role.Name == Roles.TeamLeader)));

        if (currentUserRole == Roles.TeamLeader)
        {
            if (!sourceTeamId.HasValue)
            {
                throw new UnauthorizedAccessException(
                    "A team leader can transfer only a ticket that belongs to their team.");
            }

            assignedByQuery = assignedByQuery.Where(tm =>
                tm.TeamId == sourceTeamId.Value &&
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
                    "You are not an active leader of the ticket's current team.");
            }

            throw new ArgumentException(
                "The logged-in user is not an active team member.");
        }

        // Cross-team transfers always enter the destination team's queue.
        // The destination team leader chooses the new assignee afterwards.
        var targetAssignedToId = isCrossTeamTransfer
            ? (Guid?)null
            : assignmentDto.TeamMemberId ?? assignedBy.Id;

        TeamMember? assignedTo = null;

        if (targetAssignedToId.HasValue)
        {
            assignedTo = await _context.TeamMembers
                .Include(tm => tm.User)
                .FirstOrDefaultAsync(
                    tm =>
                        tm.Id == targetAssignedToId.Value &&
                        tm.TeamId == assignmentDto.TeamId &&
                        tm.IsActive &&
                        tm.User.IsActive &&
                        tm.User.UserRoles.Any(userRole =>
                            userRole.Role.IsActive &&
                            (userRole.Role.Name == Roles.SupportAgent ||
                             userRole.Role.Name == Roles.TeamLeader)),
                    cancellationToken);

            if (assignedTo is null)
            {
                throw new ArgumentException(
                    "The selected team member was not found or does not belong to the selected team.");
            }
        }

        var changedAt = DateTime.UtcNow;
        var oldAssignment = ticket.AssignedTo is not null
            ? $"{ticket.AssignedTo.Name} {ticket.AssignedTo.LastName}"
            : ticket.Team?.Name ?? "Unassigned";

        var newAssignment = assignedTo is null
            ? $"{team.Name} / Team queue"
            : $"{team.Name} / {assignedTo.User.Name} {assignedTo.User.LastName}";

        var assignment = new Entities.TicketAssignment
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            TeamId = team.Id,
            AssignedToId = assignedTo?.Id,
            AssignedById = assignedBy.Id,
            AssignedAt = changedAt
        };

        ticket.TeamId = team.Id;
        ticket.AssignedToId = assignedTo?.UserId;

        if (ticket.Status.Name.Equals(
                "Open",
                StringComparison.OrdinalIgnoreCase))
        {
            var inProgressStatus = await _context.TicketStatuses
                .SingleOrDefaultAsync(
                    status =>
                        status.Name == "In Progress" &&
                        status.IsActive,
                    cancellationToken)
                ?? throw new InvalidOperationException(
                    "The active In Progress status was not found.");

            ticket.StatusId = inProgressStatus.Id;

            _context.TicketHistories.Add(new Entities.TicketHistory
            {
                TicketId = ticket.Id,
                ActionType = Entities.TicketHistoryActionType.StatusChanged,
                FieldName = "Status",
                OldValue = ticket.Status.Name,
                NewValue = inProgressStatus.Name,
                Description =
                    "Automatically changed because the ticket was assigned to a team.",
                ChangedById = createDto.AssignedById,
                ChangedAt = changedAt
            });
        }

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

        if (assignedTo is not null)
        {
            await _notificationService.NotifyTicketAssignedAsync(
                ticket.Id,
                assignedTo.UserId,
                createDto.AssignedById,
                cancellationToken);
        }
        else
        {
            await _notificationService.NotifyTeamLeadersOfTransferredTicketAsync(
                ticket.Id,
                createDto.AssignedById,
                cancellationToken);
        }

        return new TicketAssignmentResponseDto
        {
            Id = assignment.Id,
            TicketId = ticket.Id,
            TeamId = team.Id,
            TeamName = team.Name,
            TeamMemberId = assignedTo?.Id,
            TeamMemberName = assignedTo is null
                ? null
                : $"{assignedTo.User.Name} {assignedTo.User.LastName}",
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
                TeamMemberName = x.AssignedToTeamMember == null
                    ? null
                    : x.AssignedToTeamMember.User.Name + " " +
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
                TeamMemberName = x.AssignedToTeamMember == null
                    ? null
                    : x.AssignedToTeamMember.User.Name + " " +
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
