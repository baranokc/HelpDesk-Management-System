namespace backend.DTO.TeamChat;

public sealed class TeamChatRoomDto
{
    public Guid TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public string TeamDescription { get; set; } = string.Empty;
    public string RoleInTeam { get; set; } = string.Empty;
    public int ActiveMemberCount { get; set; }
}

public sealed class TeamChatMessageDto
{
    public Guid Id { get; set; }
    public Guid? TeamId { get; set; }
    public string Audience { get; set; } = string.Empty;
    public Guid SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string? SenderAvatarUrl { get; set; }
    public string SenderRole { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public sealed class TeamChatMessagesPageDto
{
    public IReadOnlyCollection<TeamChatMessageDto> Items { get; set; } = [];
    public bool HasMore { get; set; }
    public DateTime? NextBefore { get; set; }
}

public sealed class CreateTeamChatMessageDto
{
    public string Content { get; set; } = string.Empty;
}
