export interface NotificationDto {
  id: string;
  type: "TicketCreated" | "TicketAssigned" | "CommentAdded" | string;
  title: string;
  message: string;
  ticketId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface UnreadNotificationCountDto {
  count: number;
}

export interface MarkAllNotificationsReadDto {
  updatedCount: number;
}
