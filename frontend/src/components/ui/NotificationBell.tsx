"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useNotifications } from "@/src/context/NotificationContext";
import type { NotificationDto } from "@/src/types/notification";

function formatNotificationDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Dışarıya tıklandığında menüyü kapatma
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const openNotification = async (notification: NotificationDto) => {
    if (!notification.isRead) await markAsRead(notification.id);

    setIsOpen(false);
    if (notification.ticketId) {
      router.push(`/tickets/${notification.ticketId}`);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* ZİL BUTONU */}
      <button
        type="button"
        aria-label={`${unreadCount} unread notifications`}
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-300/70 dark:border-purple-800/40 bg-stone-100/90 dark:bg-slate-900/90 text-stone-700 dark:text-slate-200 hover:border-emerald-600/40 dark:hover:border-purple-500/50 hover:bg-stone-200/50 dark:hover:bg-slate-800/80 transition-all cursor-pointer shadow-sm group outline-none"
      >
        <Bell className="h-4 w-4 transition-transform group-hover:rotate-12 group-hover:scale-110 text-stone-600 dark:text-purple-300" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-1 text-[9px] font-black text-white shadow-md shadow-rose-500/40 animate-in zoom-in-50">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ANIMASYONLU DROPDOWN MENÜ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 z-[60] mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-stone-300/80 dark:border-purple-800/40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl"
          >
            {/* ÜST BAŞLIK BAR */}
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black tracking-tight text-stone-900 dark:text-white">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <span className="rounded-md border border-emerald-600/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-300 font-mono">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 dark:text-purple-300 dark:hover:text-purple-200 transition-colors"
                  onClick={() => void markAllAsRead()}
                  type="button"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* HATA MESAJI */}
            {error && (
              <div className="border-b border-rose-100 bg-rose-50/80 px-4 py-2 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            )}

            {/* BİLDİRİM LİSTESİ */}
            <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 dark:divide-slate-800/60">
              {loading && notifications.length === 0 ? (
                <div className="flex justify-center p-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 dark:border-purple-500 border-t-transparent" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-8 text-center text-stone-400 dark:text-slate-500">
                  <Inbox className="h-8 w-8 mb-2 opacity-50 stroke-1" />
                  <p className="text-xs font-semibold">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    className={`block w-full px-4 py-3 text-left transition-all hover:bg-stone-50 dark:hover:bg-slate-800/50 ${
                      notification.isRead
                        ? "bg-transparent opacity-75"
                        : "bg-emerald-500/5 dark:bg-purple-500/10"
                    }`}
                    key={notification.id}
                    onClick={() => void openNotification(notification)}
                    type="button"
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Durum Noktası */}
                      <span
                        aria-hidden="true"
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          notification.isRead
                            ? "bg-stone-300 dark:bg-slate-700"
                            : "bg-emerald-600 dark:bg-purple-400 shadow-sm shadow-emerald-500/50 dark:shadow-purple-500/50"
                        }`}
                      />

                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-stone-900 dark:text-slate-100 truncate">
                          {notification.title}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-stone-600 dark:text-slate-300 line-clamp-2">
                          {notification.message}
                        </span>
                        <span className="mt-1 block text-[10px] font-mono text-stone-400 dark:text-slate-500">
                          {formatNotificationDate(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}