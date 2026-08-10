export interface TeamChatRoomDto {
  teamId: string;
  teamName: string;
  teamDescription: string;
  roleInTeam: string;
  activeMemberCount: number;
}

export type TeamChatAudience = "Team" | "TeamLeaders";

export interface TeamChatMessageDto {
  id: string;
  teamId?: string | null;
  audience: TeamChatAudience;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  senderRole: string;
  content: string;
  createdAt: string;
}

export interface TeamChatMessagesPageDto {
  items: TeamChatMessageDto[];
  hasMore: boolean;
  nextBefore?: string | null;
}

export interface CreateTeamChatMessageDto {
  content: string;
}
