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
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { useAuth } from "@/src/context/AuthContext";
import { resolveHubUrl } from "@/src/lib/apiUrl";
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
  return resolveHubUrl(
    process.env.NEXT_PUBLIC_SIGNALR_URL,
    "/hubs/notifications",
  );
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

    let disposed = false;
    let retryTimer: number | undefined;

    const connect = async () => {
      setLoading(true);
      await refresh();

      const connection = new HubConnectionBuilder()
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
        setError(null);
        void refresh();
      });

      let retryAttempt = 0;

      const startConnection = async () => {
        if (
          disposed ||
          connection.state !== HubConnectionState.Disconnected
        ) {
          return;
        }

        try {
          await connection.start();
          retryAttempt = 0;

          if (!disposed) setError(null);
        } catch {
          if (disposed) return;

          setError(
            "Real-time notifications are temporarily unavailable. Saved notifications will still appear after refresh.",
          );

          const delay = Math.min(1000 * 2 ** retryAttempt, 30_000);
          retryAttempt += 1;
          retryTimer = window.setTimeout(() => {
            void startConnection();
          }, delay);
        }
      };

      connection.onclose(() => {
        if (disposed) return;

        const delay = Math.min(1000 * 2 ** retryAttempt, 30_000);
        retryAttempt += 1;
        retryTimer = window.setTimeout(() => {
          void startConnection();
        }, delay);
      });

      await startConnection();

      return connection;
    };

    let activeConnection:
      | Awaited<ReturnType<typeof connect>>
      | undefined;
    void connect().then((startedConnection) => {
      activeConnection = startedConnection;

      if (disposed && activeConnection) {
        void activeConnection.stop();
      }
    });

    return () => {
      disposed = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      if (activeConnection) void activeConnection.stop();
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
