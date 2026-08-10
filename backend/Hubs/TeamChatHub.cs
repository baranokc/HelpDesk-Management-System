using backend.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace backend.Hubs;

[Authorize(Roles = Roles.TeamLeader + "," + Roles.SupportAgent)]
public sealed class TeamChatHub : Hub
{
    public const string MessageReceivedEvent = "TeamChatMessageReceived";
    public const string TeamLeaderMessageReceivedEvent = "TeamLeaderChatMessageReceived";
}
