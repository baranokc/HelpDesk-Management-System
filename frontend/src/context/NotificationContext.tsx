"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  HubConnectionBuilder,
  LogLevel,
  type HubConnection,
} from "@microsoft/signalr";
import { useAuth } from "@/src/context/AuthContext";
import { authService } from "@/src/services/authService";
import { notificationService } from "@/src/services/notificationService";
import type { NotificationDto } from "@/src/types/notification";

interface NotificationContextValue {
  notifications: NotificationDto[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<
  NotificationContextValue | undefined
>(undefined);

function getNotificationHubUrl(): string {
  const configuredHubUrl = process.env.NEXT_PUBLIC_SIGNALR_URL;
  if (configuredHubUrl) return configuredHubUrl;

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5269/api";

  return `${apiUrl.replace(/\/api\/?$/, "")}/hubs/notifications`;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const {
    isAuthenticated,
    loading: authLoading,
    refreshSession,
  } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!authService.getToken()) return;

    try {
      setError(null);
      const [items, count] = await Promise.all([
        notificationService.getAll(false, 50),
        notificationService.getUnreadCount(),
      ]);

      setNotifications(items);
      setUnreadCount(count);
    } catch {
      setError("Notifications could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) return;

    let connection: HubConnection | null = null;
    let disposed = false;

    const connect = async () => {
      setLoading(true);
      await refresh();

      connection = new HubConnectionBuilder()
        .withUrl(getNotificationHubUrl(), {
          accessTokenFactory: () => authService.getToken() ?? "",
          withCredentials: false,
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build();

      connection.on(
        "NotificationReceived",
        (notification: NotificationDto) => {
          setNotifications((current) => {
            if (current.some((item) => item.id === notification.id))
              return current;

            return [notification, ...current].slice(0, 50);
          });

          if (!notification.isRead)
            setUnreadCount((current) => current + 1);
        },
      );

      connection.on("SessionChanged", () => {
        void refreshSession();
      });

      connection.onreconnected(() => {
        void refresh();
      });

      try {
        await connection.start();
      } catch {
        if (!disposed)
          setError(
            "Real-time notifications are temporarily unavailable. Saved notifications will still appear after refresh.",
          );
      }
    };

    void connect();

    return () => {
      disposed = true;
      if (connection) void connection.stop();
    };
  }, [authLoading, isAuthenticated, refresh, refreshSession]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const wasUnread = notifications.some(
        (notification) =>
          notification.id === notificationId && !notification.isRead,
      );

      try {
        await notificationService.markAsRead(notificationId);
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  isRead: true,
                  readAt: notification.readAt ?? new Date().toISOString(),
                }
              : notification,
          ),
        );

        if (wasUnread)
          setUnreadCount((current) => Math.max(0, current - 1));
      } catch {
        setError("The notification could not be marked as read.");
      }
    },
    [notifications],
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      const readAt = new Date().toISOString();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt ?? readAt,
        })),
      );
      setUnreadCount(0);
    } catch {
      setError("Notifications could not be marked as read.");
    }
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      refresh,
      markAsRead,
      markAllAsRead,
    }),
    [
      notifications,
      unreadCount,
      loading,
      error,
      refresh,
      markAsRead,
      markAllAsRead,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider.",
    );
  }

  return context;
}
