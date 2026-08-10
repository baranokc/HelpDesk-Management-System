"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LoaderCircle,
  MessageCircle,
  Send,
  ShieldCheck,
  UsersRound,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from "@microsoft/signalr";
import { Alert } from "@/src/components/ui/Alert";
import { Avatar } from "@/src/components/ui/Avatar";
import { useAuth } from "@/src/context/AuthContext";
import { getApiErrorMessage } from "@/src/lib/api";
import { authService } from "@/src/services/authService";
import { teamChatService } from "@/src/services/teamChatService";
import type {
  TeamChatMessageDto,
  TeamChatRoomDto,
} from "@/src/types/team-chat";

type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "offline";

const MAXIMUM_MESSAGE_LENGTH = 2000;
const TEAM_LEADER_ROOM_ID = "team-leaders";

function getTeamChatHubUrl(): string {
  const configuredHubUrl = process.env.NEXT_PUBLIC_TEAM_CHAT_SIGNALR_URL;
  if (configuredHubUrl) return configuredHubUrl;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5269/api";

  return `${apiUrl.replace(/\/api\/?$/, "")}/hubs/team-chat`;
}

function mergeMessages(
  current: TeamChatMessageDto[],
  incoming: TeamChatMessageDto[],
): TeamChatMessageDto[] {
  const messagesById = new Map(current.map((message) => [message.id, message]));

  for (const message of incoming) {
    messagesById.set(message.id, message);
  }

  return Array.from(messagesById.values()).sort((left, right) => {
    const dateComparison =
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();

    return dateComparison || left.id.localeCompare(right.id);
  });
}

function formatMessageTime(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMessageDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
  }).format(new Date(value));
}

function isSameCalendarDay(left: string, right: string): boolean {
  const leftDate = new Date(left);
  const rightDate = new Date(right);

  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  );
}

function TeamChatSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-stone-200 dark:bg-slate-800" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-xl bg-stone-200 dark:bg-slate-800" />
      </div>
      <div className="h-[68vh] min-h-[620px] animate-pulse rounded-3xl border border-stone-200/80 bg-white/80 dark:border-purple-900/40 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl" />
    </div>
  );
}

export function TeamChatContainer() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const isTeamLeader = user?.role === "TeamLeader";
  const canAccessChat =
    isTeamLeader || user?.role === "SupportAgent";
  const [rooms, setRooms] = useState<TeamChatRoomDto[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [messages, setMessages] = useState<TeamChatMessageDto[]>([]);
  const [draft, setDraft] = useState("");
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const selectedRoomIdRef = useRef(selectedRoomId);
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldScrollToBottomRef = useRef(true);

  const activeRoom = useMemo(
    () => rooms.find((room) => room.teamId === selectedRoomId) ?? null,
    [rooms, selectedRoomId],
  );
  const isTeamLeaderRoom =
    isTeamLeader && selectedRoomId === TEAM_LEADER_ROOM_ID;
  const availableRoomCount = rooms.length + (isTeamLeader ? 1 : 0);
  const activeRoomName = isTeamLeaderRoom
    ? "Team Leaders"
    : activeRoom?.teamName;
  const activeRoomDescription = isTeamLeaderRoom
    ? "Private leadership room shared by active team leaders."
    : activeRoom?.teamDescription || "Private space for your team.";

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  useEffect(() => {
    if (!authLoading && !canAccessChat) {
      router.replace("/tickets");
    }
  }, [authLoading, canAccessChat, router]);

  useEffect(() => {
    if (authLoading || !canAccessChat) return;

    let cancelled = false;

    void teamChatService
      .getRooms()
      .then((loadedRooms) => {
        if (cancelled) return;

        setRooms(loadedRooms);
        setSelectedRoomId((current) => {
          const currentRoomStillExists =
            (isTeamLeader && current === TEAM_LEADER_ROOM_ID) ||
            loadedRooms.some((room) => room.teamId === current);

          if (currentRoomStillExists) return current;
          if (isTeamLeader) return TEAM_LEADER_ROOM_ID;

          return loadedRooms[0]?.teamId ?? "";
        });
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            getApiErrorMessage(requestError, "Team chats could not be loaded."),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setRoomsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, canAccessChat, isTeamLeader]);

  useEffect(() => {
    if (!selectedRoomId) {
      Promise.resolve().then(() => {
        setMessages([]);
        setHasMore(false);
        setNextBefore(null);
      });
      return;
    }

    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        setMessagesLoading(true);
        setError(null);
      }
    });

    const messagesRequest = isTeamLeaderRoom
      ? teamChatService.getTeamLeaderMessages()
      : teamChatService.getMessages(selectedRoomId);

    void messagesRequest
      .then((page) => {
        if (cancelled) return;

        shouldScrollToBottomRef.current = true;
        setMessages(page.items);
        setHasMore(page.hasMore);
        setNextBefore(page.nextBefore ?? null);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setMessages([]);
          setError(
            getApiErrorMessage(requestError, "Messages could not be loaded."),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setMessagesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isTeamLeaderRoom, selectedRoomId]);

  useEffect(() => {
    if (authLoading || !canAccessChat || !authService.getToken()) return;

    let disposed = false;
    let connection: HubConnection | null = null;

    connection = new HubConnectionBuilder()
      .withUrl(getTeamChatHubUrl(), {
        accessTokenFactory: () => authService.getToken() ?? "",
        withCredentials: false,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on("TeamChatMessageReceived", (message: TeamChatMessageDto) => {
      if (
        message.audience !== "Team" ||
        message.teamId !== selectedRoomIdRef.current
      ) {
        return;
      }

      shouldScrollToBottomRef.current = true;
      setMessages((current) => mergeMessages(current, [message]));
    });

    connection.on(
      "TeamLeaderChatMessageReceived",
      (message: TeamChatMessageDto) => {
        if (
          message.audience !== "TeamLeaders" ||
          selectedRoomIdRef.current !== TEAM_LEADER_ROOM_ID
        ) {
          return;
        }

        shouldScrollToBottomRef.current = true;
        setMessages((current) => mergeMessages(current, [message]));
      },
    );

    connection.onreconnecting(() => {
      if (!disposed) setConnectionStatus("reconnecting");
    });

    connection.onreconnected(() => {
      if (!disposed) setConnectionStatus("connected");
    });

    connection.onclose(() => {
      if (!disposed) setConnectionStatus("offline");
    });

    const startTimer = window.setTimeout(() => {
      if (disposed) return;

      void connection
        .start()
        .then(async () => {
          if (disposed) {
            if (connection.state !== HubConnectionState.Disconnected) {
              await connection.stop();
            }
            return;
          }

          setConnectionStatus("connected");
        })
        .catch(() => {
          if (!disposed) {
            setConnectionStatus("offline");
          }
        });
    }, 0);

    return () => {
      disposed = true;
      window.clearTimeout(startTimer);

      if (
        connection.state === HubConnectionState.Connected ||
        connection.state === HubConnectionState.Reconnecting
      ) {
        void connection.stop();
      }
    };
  }, [authLoading, canAccessChat]);

  useEffect(() => {
    if (!shouldScrollToBottomRef.current) return;

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    shouldScrollToBottomRef.current = false;
  }, [messages]);

  const handleLoadOlder = async () => {
    if (!selectedRoomId || !nextBefore || loadingOlder) return;

    const viewport = messagesViewportRef.current;
    const previousScrollHeight = viewport?.scrollHeight ?? 0;
    setLoadingOlder(true);
    setError(null);

    try {
      const page = isTeamLeaderRoom
        ? await teamChatService.getTeamLeaderMessages(nextBefore)
        : await teamChatService.getMessages(selectedRoomId, nextBefore);

      shouldScrollToBottomRef.current = false;
      setMessages((current) => mergeMessages(page.items, current));
      setHasMore(page.hasMore);
      setNextBefore(page.nextBefore ?? null);

      window.requestAnimationFrame(() => {
        if (viewport) {
          viewport.scrollTop += viewport.scrollHeight - previousScrollHeight;
        }
      });
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(
          requestError,
          "Previous messages could not be loaded.",
        ),
      );
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!selectedRoomId || !content || sending) return;

    setSending(true);
    setError(null);

    try {
      const message = isTeamLeaderRoom
        ? await teamChatService.sendTeamLeaderMessage({ content })
        : await teamChatService.sendMessage(selectedRoomId, { content });

      shouldScrollToBottomRef.current = true;
      setMessages((current) => mergeMessages(current, [message]));
      setDraft("");
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(requestError, "The message could not be sent."),
      );
    } finally {
      setSending(false);
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  if (authLoading || !canAccessChat || roomsLoading) {
    return <TeamChatSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Üst Başlık ve Bağlantı Durumu */}
      <div className="animate-in fade-in slide-in-from-bottom-3 flex flex-col gap-3 duration-500 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-black tracking-tight bg-gradient-to-r from-amber-800 via-emerald-800 to-teal-900 dark:from-purple-300 dark:via-violet-200 dark:to-indigo-200 bg-clip-text text-transparent">
            <MessageCircle className="h-6 w-6 text-emerald-700 dark:text-purple-400" />
            Team Chat
          </h1>
          <p className="mt-1 text-xs font-medium text-stone-500 dark:text-slate-400">
            Private conversations for teams and their leaders.
          </p>
        </div>

        <span
          className={`inline-flex w-fit items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-bold shadow-sm ${
            connectionStatus === "connected"
              ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "border-amber-600/30 bg-amber-500/10 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
          }`}
        >
          {connectionStatus === "connected" ? (
            <Wifi className="h-3.5 w-3.5" />
          ) : (
            <WifiOff className="h-3.5 w-3.5" />
          )}
          {connectionStatus === "connected"
            ? "Live"
            : connectionStatus === "reconnecting"
              ? "Reconnecting"
              : connectionStatus === "connecting"
                ? "Connecting"
                : "Offline mode"}
        </span>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {availableRoomCount === 0 ? (
        <div className="flex min-h-96 flex-col items-center justify-center rounded-3xl border border-stone-200/80 bg-white/80 px-6 text-center shadow-xl dark:border-purple-900/40 dark:bg-slate-900/80 backdrop-blur-2xl">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:border-purple-500/30 dark:bg-purple-500/15 dark:text-purple-300 shadow-inner">
            <UsersRound className="h-7 w-7" />
          </div>
          <h2 className="text-base font-bold text-stone-900 dark:text-white">
            No team chat available
          </h2>
          <p className="mt-1 max-w-md text-xs font-medium text-stone-500 dark:text-slate-400">
            An active team membership is required before you can access team
            chat.
          </p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 grid min-h-[620px] overflow-hidden rounded-3xl border border-stone-200/80 bg-white/80 shadow-xl duration-500 dark:border-purple-900/40 dark:bg-slate-900/80 backdrop-blur-2xl lg:h-[calc(100vh-13rem)] lg:max-h-[760px] lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Sol Panel: Oda Listesi */}
          <aside className="border-b border-stone-200/80 bg-stone-50/70 dark:border-purple-900/40 dark:bg-slate-950/40 lg:border-b-0 lg:border-r">
            <div className="border-b border-stone-200/80 px-4 py-4 dark:border-purple-900/40">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-purple-300/60">
                Chat Rooms
              </p>
              <p className="mt-1 text-xs font-medium text-stone-400 dark:text-slate-400">
                {availableRoomCount} available room(s)
              </p>
            </div>

            <div className="flex gap-2 overflow-x-auto p-3 lg:block lg:space-y-2 lg:overflow-visible">
              {isTeamLeader && (
                <button
                  className={`min-w-56 rounded-2xl border p-3.5 text-left transition-all lg:w-full lg:min-w-0 ${
                    isTeamLeaderRoom
                      ? "border-emerald-600/40 bg-emerald-500/10 text-stone-900 shadow-sm dark:border-purple-500/50 dark:bg-purple-500/20 dark:text-white"
                      : "border-stone-200/60 bg-white/70 text-stone-700 hover:border-emerald-600/30 hover:bg-stone-100/70 dark:border-purple-900/30 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-purple-500/40 dark:hover:bg-purple-500/10"
                  }`}
                  onClick={() => setSelectedRoomId(TEAM_LEADER_ROOM_ID)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-xs font-bold">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700 dark:text-purple-400" />
                        Team Leaders
                      </p>
                      <p className="mt-1 truncate text-[11px] font-medium text-stone-500 dark:text-purple-300/70">
                        Leadership Room
                      </p>
                    </div>
                    {isTeamLeaderRoom && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-600 dark:bg-purple-400 shadow-sm" />
                    )}
                  </div>
                  <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-purple-300">
                    <ShieldCheck className="h-3 w-3" />
                    Team leaders only
                  </span>
                </button>
              )}

              {rooms.map((room) => {
                const isActive = room.teamId === selectedRoomId;

                return (
                  <button
                    className={`min-w-56 rounded-2xl border p-3.5 text-left transition-all lg:w-full lg:min-w-0 ${
                      isActive
                        ? "border-emerald-600/40 bg-emerald-500/10 text-stone-900 shadow-sm dark:border-purple-500/50 dark:bg-purple-500/20 dark:text-white"
                        : "border-stone-200/60 bg-white/70 text-stone-700 hover:border-emerald-600/30 hover:bg-stone-100/70 dark:border-purple-900/30 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-purple-500/40 dark:hover:bg-purple-500/10"
                    }`}
                    key={room.teamId}
                    onClick={() => setSelectedRoomId(room.teamId)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">
                          {room.teamName}
                        </p>
                        <p className="mt-1 truncate text-[11px] font-medium text-stone-500 dark:text-slate-400">
                          {room.roleInTeam}
                        </p>
                      </div>
                      {isActive && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-600 dark:bg-purple-400 shadow-sm" />
                      )}
                    </div>
                    <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-bold text-stone-500 dark:text-slate-400">
                      <UsersRound className="h-3 w-3" />
                      {room.activeMemberCount} active members
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Sağ Panel: Mesajlaşma Alanı */}
          <section className="flex min-h-0 flex-col bg-transparent">
            <header className="flex items-center justify-between gap-4 border-b border-stone-200/80 px-5 py-4 dark:border-purple-900/40 bg-white/40 dark:bg-slate-900/40">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-stone-900 dark:text-white">
                  {activeRoomName}
                </h2>
                <p className="mt-0.5 truncate text-xs font-medium text-stone-500 dark:text-slate-400">
                  {activeRoomDescription}
                </p>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1 text-[10px] font-extrabold shadow-sm ${
                  isTeamLeaderRoom
                    ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:border-purple-500/30 dark:bg-purple-500/15 dark:text-purple-300"
                    : "border-stone-200/80 bg-stone-100 text-stone-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 dark:text-purple-400" />
                {isTeamLeaderRoom ? "Leaders only" : "Team only"}
              </span>
            </header>

            <div
              className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6"
              ref={messagesViewportRef}
            >
              {hasMore && (
                <div className="mb-5 flex justify-center">
                  <button
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-300/80 bg-white px-3.5 py-1.5 text-xs font-bold text-stone-700 shadow-sm transition-all hover:border-emerald-600 hover:text-emerald-800 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white cursor-pointer"
                    disabled={loadingOlder}
                    onClick={() => void handleLoadOlder()}
                    type="button"
                  >
                    {loadingOlder ? (
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                    )}
                    Load previous messages
                  </button>
                </div>
              )}

              {messagesLoading ? (
                <div className="flex h-full min-h-64 items-center justify-center">
                  <LoaderCircle className="h-7 w-7 animate-spin text-emerald-700 dark:text-purple-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:border-purple-500/30 dark:bg-purple-500/15 dark:text-purple-300 shadow-inner">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                    Start the conversation
                  </h3>
                  <p className="mt-1 text-xs font-medium text-stone-500 dark:text-slate-400">
                    {isTeamLeaderRoom
                      ? "Messages posted here are visible only to active team leaders."
                      : "Messages posted here are visible only to this team."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isOwnMessage = message.senderId === user?.id;
                    const previousMessage = messages[index - 1];
                    const showDateSeparator =
                      !previousMessage ||
                      !isSameCalendarDay(
                        previousMessage.createdAt,
                        message.createdAt,
                      );

                    const roleLower = message.senderRole?.toLowerCase().trim() || "";
                    const roleBadgeClass =
                      roleLower.includes("admin") || roleLower === "0"
                        ? "bg-amber-500/15 text-amber-800 dark:bg-pink-500/25 dark:text-pink-300 border border-amber-600/30 dark:border-pink-400/80"
                        : roleLower.includes("teamleader") || roleLower === "1"
                          ? "bg-red-500/15 text-red-800 dark:bg-yellow-400/20 dark:text-yellow-300 border border-red-600/30 dark:border-yellow-400/80"
                          : roleLower.includes("supportagent") || roleLower === "2"
                            ? "bg-teal-500/15 text-teal-800 dark:bg-blue-500/20 dark:text-blue-300 border border-teal-600/30 dark:border-blue-500/40"
                            : "bg-stone-900/10 text-stone-900 dark:bg-slate-100/15 dark:text-slate-100 border border-stone-900/25 dark:border-slate-100/30";

                    return (
                      <div key={message.id}>
                        {showDateSeparator && (
                          <div className="mb-4 flex items-center gap-3">
                            <span className="h-px flex-1 bg-stone-200 dark:bg-slate-800" />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
                              {formatMessageDate(message.createdAt)}
                            </span>
                            <span className="h-px flex-1 bg-stone-200 dark:bg-slate-800" />
                          </div>
                        )}

                        <div
                          className={`flex items-end gap-2.5 ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!isOwnMessage && (
                            <Avatar
                              avatarUrl={message.senderAvatarUrl}
                              name={message.senderName}
                              size="sm"
                            />
                          )}

                          <div
                            className={`max-w-[82%] sm:max-w-[70%] ${
                              isOwnMessage ? "text-right" : "text-left"
                            }`}
                          >
                            {!isOwnMessage && (
                              <div className="mb-1 flex items-center gap-2 px-1">
                                <span className="truncate text-xs font-bold text-stone-800 dark:text-slate-200">
                                  {message.senderName}
                                </span>
                                <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${roleBadgeClass}`}>
                                  {message.senderRole}
                                </span>
                              </div>
                            )}

                            <div
                              className={`rounded-2xl px-4 py-3 text-left text-xs font-medium leading-relaxed shadow-sm ${
                                isOwnMessage
                                  ? "rounded-br-md bg-gradient-to-r from-emerald-600 to-teal-700 text-white dark:from-purple-600 dark:to-indigo-600 shadow-md shadow-emerald-700/20 dark:shadow-purple-600/20"
                                  : "rounded-bl-md border border-stone-200/80 bg-white text-stone-800 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-100"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            </div>
                            <p
                              className={`mt-1 px-1 text-[10px] font-semibold text-stone-400 dark:text-slate-500 ${
                                isOwnMessage ? "text-right" : "text-left"
                              }`}
                            >
                              {formatMessageTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Mesaj Yazma Alanı (Composer) */}
            <div className="border-t border-stone-200/80 bg-white/60 p-4 dark:border-purple-900/40 dark:bg-slate-900/80 backdrop-blur-xl">
              <div className="rounded-2xl border border-stone-300/80 bg-stone-50/80 p-2.5 shadow-inner transition-all focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/15 dark:border-purple-900/50 dark:bg-slate-950/60 dark:focus-within:border-purple-500 dark:focus-within:ring-purple-500/20">
                <textarea
                  className="max-h-32 min-h-12 w-full resize-none bg-transparent px-2 py-1.5 text-xs font-medium text-stone-900 outline-none placeholder:text-stone-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                  maxLength={MAXIMUM_MESSAGE_LENGTH}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder={`Message ${activeRoomName ?? "your team"}...`}
                  rows={2}
                  value={draft}
                />

                <div className="flex items-center justify-between gap-3 border-t border-stone-200/80 px-1 pt-2 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-stone-400 dark:text-slate-500">
                    <span>Enter to send</span>
                    <span>·</span>
                    <span>Shift + Enter for a new line</span>
                    <span>·</span>
                    <span>
                      {draft.length}/{MAXIMUM_MESSAGE_LENGTH}
                    </span>
                  </div>

                  <button
                    aria-label="Send message"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-700/20 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 dark:from-purple-600 dark:to-indigo-600 dark:shadow-purple-600/30 cursor-pointer"
                    disabled={!draft.trim() || sending}
                    onClick={() => void handleSend()}
                    type="button"
                  >
                    {sending ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}