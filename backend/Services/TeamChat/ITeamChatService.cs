using backend.DTO.TeamChat;

namespace backend.Services.TeamChat;

public interface ITeamChatService
{
    Task<IReadOnlyCollection<TeamChatRoomDto>> GetRoomsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<TeamChatMessagesPageDto> GetMessagesAsync(
        Guid userId,
        Guid teamId,
        DateTime? before,
        int limit,
        CancellationToken cancellationToken = default);

    Task<TeamChatMessageDto> SendMessageAsync(
        Guid userId,
        Guid teamId,
        CreateTeamChatMessageDto dto,
        CancellationToken cancellationToken = default);
}
