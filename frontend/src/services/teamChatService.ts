import { api } from "@/src/lib/api";
import type {
  CreateTeamChatMessageDto,
  TeamChatMessageDto,
  TeamChatMessagesPageDto,
  TeamChatRoomDto,
} from "@/src/types/team-chat";

export const teamChatService = {
  getRooms: async (): Promise<TeamChatRoomDto[]> => {
    const response = await api.get<TeamChatRoomDto[]>("/team-chat/rooms");
    return response.data;
  },

  getMessages: async (
    teamId: string,
    before?: string | null,
    limit = 50,
  ): Promise<TeamChatMessagesPageDto> => {
    const response = await api.get<TeamChatMessagesPageDto>(
      `/team-chat/rooms/${teamId}/messages`,
      {
        params: {
          before: before || undefined,
          limit,
        },
      },
    );

    return response.data;
  },

  sendMessage: async (
    teamId: string,
    dto: CreateTeamChatMessageDto,
  ): Promise<TeamChatMessageDto> => {
    const response = await api.post<TeamChatMessageDto>(
      `/team-chat/rooms/${teamId}/messages`,
      dto,
    );

    return response.data;
  },

  getTeamLeaderMessages: async (
    before?: string | null,
    limit = 50,
  ): Promise<TeamChatMessagesPageDto> => {
    const response = await api.get<TeamChatMessagesPageDto>(
      "/team-chat/leader-room/messages",
      {
        params: {
          before: before || undefined,
          limit,
        },
      },
    );

    return response.data;
  },

  sendTeamLeaderMessage: async (
    dto: CreateTeamChatMessageDto,
  ): Promise<TeamChatMessageDto> => {
    const response = await api.post<TeamChatMessageDto>(
      "/team-chat/leader-room/messages",
      dto,
    );

    return response.data;
  },
};
