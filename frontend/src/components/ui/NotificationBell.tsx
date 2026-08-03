"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/src/context/NotificationContext";
import type { NotificationDto } from "@/src/types/notification";

function formatNotificationDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NotificationBell() {
  const router = useRouter();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const openNotification = async (notification: NotificationDto) => {
    if (!notification.isRead) await markAsRead(notification.id);

    detailsRef.current?.removeAttribute("open");
    if (notification.ticketId)
      router.push(`/tickets/${notification.ticketId}`);
  };

  return (
    <details ref={detailsRef} className="dropdown dropdown-end">
      <summary
        aria-label={`${unreadCount} unread notifications`}
        className="btn btn-ghost btn-circle btn-sm relative list-none text-slate-600 dark:text-slate-300"
        role="button"
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </summary>

      <div className="dropdown-content z-[60] mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Notifications
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {unreadCount} unread
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              onClick={() => void markAllAsRead()}
              type="button"
            >
              Mark all as read
            </button>
          )}
        </div>

        {error && (
          <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            {error}
          </div>
        )}

        <div className="max-h-96 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex justify-center p-8">
              <span className="loading loading-spinner loading-sm text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No notifications yet.
            </p>
          ) : (
            notifications.map((notification) => (
              <button
                className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 ${
                  notification.isRead
                    ? "bg-white dark:bg-slate-900"
                    : "bg-blue-50 dark:bg-blue-950/40"
                }`}
                key={notification.id}
                onClick={() => void openNotification(notification)}
                type="button"
              >
                <span className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      notification.isRead ? "bg-slate-300" : "bg-blue-600"
                    }`}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                      {notification.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300">
                      {notification.message}
                    </span>
                    <span className="mt-1.5 block text-[11px] text-slate-400 dark:text-slate-500">
                      {formatNotificationDate(notification.createdAt)}
                    </span>
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </details>
  );
}
