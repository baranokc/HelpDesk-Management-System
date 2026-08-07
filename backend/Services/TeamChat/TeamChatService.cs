using backend.Constants;
using backend.Data;
using backend.DTO.TeamChat;
using backend.Entities;
using backend.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.TeamChat;

public sealed class TeamChatService : ITeamChatService
{
    private const int MaximumMessageLength = 2000;

    private readonly AppDbContext _db;
    private readonly IHubContext<TeamChatHub> _hubContext;
    private readonly ILogger<TeamChatService> _logger;

    public TeamChatService(
        AppDbContext db,
        IHubContext<TeamChatHub> hubContext,
        ILogger<TeamChatService> logger)
    {
        _db = db;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task<IReadOnlyCollection<TeamChatRoomDto>> GetRoomsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var roomRows = await _db.TeamMembers
            .AsNoTracking()
            .Where(member =>
                member.UserId == userId &&
                member.IsActive &&
                member.Team.IsActive &&
                member.User.IsActive &&
                member.User.Role != null &&
                member.User.Role.IsActive &&
                (member.User.Role.Name == Roles.TeamLeader ||
                 member.User.Role.Name == Roles.SupportAgent))
            .OrderBy(member => member.Team.Name)
            .Select(member => new
            {
                member.TeamId,
                TeamName = member.Team.Name,
                TeamDescription = member.Team.Description,
                member.RoleInTeam,
                ActiveMemberCount = member.Team.TeamMembers.Count(teamMember =>
                    teamMember.IsActive &&
                    teamMember.User.IsActive &&
                    teamMember.User.Role != null &&
                    teamMember.User.Role.IsActive &&
                    (teamMember.User.Role.Name == Roles.TeamLeader ||
                     teamMember.User.Role.Name == Roles.SupportAgent))
            })
            .ToListAsync(cancellationToken);

        return roomRows
            .GroupBy(room => room.TeamId)
            .Select(group => group.First())
            .Select(room => new TeamChatRoomDto
            {
                TeamId = room.TeamId,
                TeamName = room.TeamName,
                TeamDescription = room.TeamDescription,
                RoleInTeam = room.RoleInTeam.ToString(),
                ActiveMemberCount = room.ActiveMemberCount
            })
            .ToList();
    }

    public async Task<TeamChatMessagesPageDto> GetMessagesAsync(
        Guid userId,
        Guid teamId,
        DateTime? before,
        int limit,
        CancellationToken cancellationToken = default)
    {
        await EnsureActiveMembershipAsync(
            userId,
            teamId,
            cancellationToken);

        var normalizedLimit = Math.Clamp(limit, 1, 100);
        var query = _db.TeamChatMessages
            .AsNoTracking()
            .Where(message => message.TeamId == teamId);

        if (before.HasValue)
        {
            var beforeUtc = before.Value.Kind switch
            {
                DateTimeKind.Utc => before.Value,
                DateTimeKind.Local => before.Value.ToUniversalTime(),
                _ => DateTime.SpecifyKind(before.Value, DateTimeKind.Utc)
            };

            query = query.Where(message => message.CreatedAt < beforeUtc);
        }

        var rows = await query
            .OrderByDescending(message => message.CreatedAt)
            .ThenByDescending(message => message.Id)
            .Take(normalizedLimit + 1)
            .Select(message => new TeamChatMessageDto
            {
                Id = message.Id,
                TeamId = message.TeamId,
                SenderId = message.SenderId,
                SenderName =
                    message.Sender.Name + " " + message.Sender.LastName,
                SenderAvatarUrl = message.Sender.AvatarFileName == null
                    ? null
                    : "/uploads/avatars/" + message.Sender.AvatarFileName,
                SenderRole = message.Sender.Role != null
                    ? message.Sender.Role.Name
                    : "User",
                Content = message.Content,
                CreatedAt = message.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var hasMore = rows.Count > normalizedLimit;
        var items = rows
            .Take(normalizedLimit)
            .OrderBy(message => message.CreatedAt)
            .ThenBy(message => message.Id)
            .ToList();

        return new TeamChatMessagesPageDto
        {
            Items = items,
            HasMore = hasMore,
            NextBefore = hasMore && items.Count > 0
                ? items[0].CreatedAt
                : null
        };
    }

    public async Task<TeamChatMessageDto> SendMessageAsync(
        Guid userId,
        Guid teamId,
        CreateTeamChatMessageDto dto,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(dto);

        var content = dto.Content?.Replace("\r\n", "\n").Trim()
            ?? string.Empty;

        if (string.IsNullOrWhiteSpace(content))
            throw new ArgumentException("Message content is required.");

        if (content.Length > MaximumMessageLength)
        {
            throw new ArgumentException(
                $"Message content cannot exceed {MaximumMessageLength} characters.");
        }

        await EnsureActiveMembershipAsync(
            userId,
            teamId,
            cancellationToken);

        var sender = await _db.Users
            .AsNoTracking()
            .Where(user => user.Id == userId && user.IsActive)
            .Select(user => new
            {
                user.Id,
                user.Name,
                user.LastName,
                user.AvatarFileName,
                RoleName = user.Role != null
                    ? user.Role.Name
                    : "User"
            })
            .SingleAsync(cancellationToken);

        var entity = new TeamChatMessage
        {
            Id = Guid.NewGuid(),
            TeamId = teamId,
            SenderId = userId,
            Content = content,
            CreatedAt = DateTime.UtcNow
        };

        _db.TeamChatMessages.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        var message = new TeamChatMessageDto
        {
            Id = entity.Id,
            TeamId = entity.TeamId,
            SenderId = sender.Id,
            SenderName = $"{sender.Name} {sender.LastName}".Trim(),
            SenderAvatarUrl = string.IsNullOrWhiteSpace(sender.AvatarFileName)
                ? null
                : $"/uploads/avatars/{sender.AvatarFileName}",
            SenderRole = sender.RoleName,
            Content = entity.Content,
            CreatedAt = entity.CreatedAt
        };

        var recipientUserIds = await _db.TeamMembers
            .AsNoTracking()
            .Where(member =>
                member.TeamId == teamId &&
                member.IsActive &&
                member.Team.IsActive &&
                member.User.IsActive &&
                member.User.Role != null &&
                member.User.Role.IsActive &&
                (member.User.Role.Name == Roles.TeamLeader ||
                 member.User.Role.Name == Roles.SupportAgent))
            .Select(member => member.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var recipientIds = recipientUserIds
            .Select(recipientUserId => recipientUserId.ToString())
            .ToList();

        try
        {
            await _hubContext.Clients
                .Users(recipientIds)
                .SendAsync(
                    TeamChatHub.MessageReceivedEvent,
                    message,
                    cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Team chat message {MessageId} was persisted but could not be delivered in real time.",
                entity.Id);
        }

        return message;
    }

    private async Task EnsureActiveMembershipAsync(
        Guid userId,
        Guid teamId,
        CancellationToken cancellationToken)
    {
        var hasMembership = await _db.TeamMembers
            .AsNoTracking()
            .AnyAsync(member =>
                member.TeamId == teamId &&
                member.UserId == userId &&
                member.IsActive &&
                member.Team.IsActive &&
                member.User.IsActive &&
                member.User.Role != null &&
                member.User.Role.IsActive &&
                (member.User.Role.Name == Roles.TeamLeader ||
                 member.User.Role.Name == Roles.SupportAgent),
                cancellationToken);

        if (!hasMembership)
        {
            throw new UnauthorizedAccessException(
                "You can access only chats for teams where you are an active member.");
        }
    }
}
