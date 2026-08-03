import { api } from "@/src/lib/api";
import type {
  MarkAllNotificationsReadDto,
  NotificationDto,
  UnreadNotificationCountDto,
} from "@/src/types/notification";

export const notificationService = {
  getAll: async (
    unreadOnly = false,
    limit = 50,
  ): Promise<NotificationDto[]> => {
    const response = await api.get<NotificationDto[]>("/notifications", {
      params: { unreadOnly, limit },
    });

    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<UnreadNotificationCountDto>(
      "/notifications/unread-count",
    );

    return response.data.count;
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await api.patch(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (): Promise<number> => {
    const response = await api.patch<MarkAllNotificationsReadDto>(
      "/notifications/read-all",
    );

    return response.data.updatedCount;
  },
};
