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
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="h-[68vh] min-h-[620px] animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
    </div>
  );
}

export function TeamChatContainer() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const canAccessChat =
    user?.role === "TeamLeader" || user?.role === "SupportAgent";
  const [rooms, setRooms] = useState<TeamChatRoomDto[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
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
  const selectedTeamIdRef = useRef(selectedTeamId);
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldScrollToBottomRef = useRef(true);

  const activeRoom = useMemo(
    () => rooms.find((room) => room.teamId === selectedTeamId) ?? null,
    [rooms, selectedTeamId],
  );

  useEffect(() => {
    selectedTeamIdRef.current = selectedTeamId;
  }, [selectedTeamId]);

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
        setSelectedTeamId((current) =>
          loadedRooms.some((room) => room.teamId === current)
            ? current
            : (loadedRooms[0]?.teamId ?? ""),
        );
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
  }, [authLoading, canAccessChat]);

  useEffect(() => {
    if (!selectedTeamId) {
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

    void teamChatService
      .getMessages(selectedTeamId)
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
  }, [selectedTeamId]);

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
      if (message.teamId !== selectedTeamIdRef.current) return;

      shouldScrollToBottomRef.current = true;
      setMessages((current) => mergeMessages(current, [message]));
    });

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
    if (!selectedTeamId || !nextBefore || loadingOlder) return;

    const viewport = messagesViewportRef.current;
    const previousScrollHeight = viewport?.scrollHeight ?? 0;
    setLoadingOlder(true);
    setError(null);

    try {
      const page = await teamChatService.getMessages(
        selectedTeamId,
        nextBefore,
      );

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
    if (!selectedTeamId || !content || sending) return;

    setSending(true);
    setError(null);

    try {
      const message = await teamChatService.sendMessage(selectedTeamId, {
        content,
      });

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
      <div className="animate-in fade-in slide-in-from-bottom-3 flex flex-col gap-3 duration-500 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            <MessageCircle className="h-6 w-6 text-indigo-500 dark:text-violet-400" />
            Team Chat
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Private conversations shared only with active members of your team.
          </p>
        </div>

        <span
          className={`inline-flex w-fit items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold ${
            connectionStatus === "connected"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
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

      {rooms.length === 0 ? (
        <div className="flex min-h-96 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-500 dark:text-violet-400">
            <UsersRound className="h-7 w-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            No team chat available
          </h2>
          <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
            An active team membership is required before you can access team
            chat.
          </p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 grid min-h-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm duration-500 dark:border-slate-800 dark:bg-slate-900/80 lg:h-[calc(100vh-13rem)] lg:max-h-[760px] lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/30 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Your Teams
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {rooms.length} available room(s)
              </p>
            </div>

            <div className="flex gap-2 overflow-x-auto p-3 lg:block lg:space-y-2 lg:overflow-visible">
              {rooms.map((room) => {
                const isActive = room.teamId === selectedTeamId;

                return (
                  <button
                    className={`min-w-56 rounded-xl border p-3 text-left transition-all lg:w-full lg:min-w-0 ${
                      isActive
                        ? "border-indigo-300 bg-indigo-50 text-indigo-900 shadow-sm dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-white"
                        : "border-transparent bg-white/70 text-slate-700 hover:border-slate-200 hover:bg-white dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10"
                    }`}
                    key={room.teamId}
                    onClick={() => setSelectedTeamId(room.teamId)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {room.teamName}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {room.roleInTeam}
                        </p>
                      </div>
                      {isActive && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500 dark:bg-violet-400" />
                      )}
                    </div>
                    <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      <UsersRound className="h-3 w-3" />
                      {room.activeMemberCount} active members
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col">
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-slate-900 dark:text-white">
                  {activeRoom?.teamName}
                </h2>
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                  {activeRoom?.teamDescription ||
                    "Private space for your team."}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-500 dark:text-violet-400" />
                Team only
              </span>
            </header>

            <div
              className="min-h-0 flex-1 overflow-y-auto bg-slate-50/40 px-4 py-5 dark:bg-slate-950/20 sm:px-6"
              ref={messagesViewportRef}
            >
              {hasMore && (
                <div className="mb-5 flex justify-center">
                  <button
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:border-indigo-300 hover:text-indigo-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-600 dark:hover:text-white"
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
                  <LoaderCircle className="h-7 w-7 animate-spin text-indigo-500 dark:text-violet-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-500 dark:text-violet-400">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Start the conversation
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Messages posted here are visible only to this team.
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

                    return (
                      <div key={message.id}>
                        {showDateSeparator && (
                          <div className="mb-4 flex items-center gap-3">
                            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              {formatMessageDate(message.createdAt)}
                            </span>
                            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
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
                                <span className="truncate text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                  {message.senderName}
                                </span>
                                <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                  {message.senderRole}
                                </span>
                              </div>
                            )}

                            <div
                              className={`rounded-2xl px-3.5 py-2.5 text-left text-sm leading-relaxed shadow-sm ${
                                isOwnMessage
                                  ? "rounded-br-md bg-indigo-600 text-white dark:bg-violet-600"
                                  : "rounded-bl-md border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            </div>
                            <p
                              className={`mt-1 px-1 text-[10px] text-slate-400 dark:text-slate-500 ${
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

            <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/90">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-2 shadow-inner transition-all focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-950/50 dark:focus-within:border-violet-500 dark:focus-within:ring-violet-500/15">
                <textarea
                  className="max-h-32 min-h-12 w-full resize-none bg-transparent px-2 py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                  maxLength={MAXIMUM_MESSAGE_LENGTH}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder={`Message ${activeRoom?.teamName ?? "your team"}...`}
                  rows={2}
                  value={draft}
                />

                <div className="flex items-center justify-between gap-3 border-t border-slate-200/80 px-1 pt-2 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
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
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-500 bg-indigo-600 text-white shadow-sm transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-violet-500 dark:bg-violet-600 dark:hover:bg-violet-500"
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
