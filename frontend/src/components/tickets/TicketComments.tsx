"use client";

import { Lock, MessageSquare, MoreHorizontal } from "lucide-react";
import type { TicketAttachmentDto } from "@/src/types/ticket-attachment";
import type { TicketCommentDto } from "@/src/types/ticket-comment";
import { Avatar } from "@/src/components/ui/Avatar";
import { Dropdown } from "@/src/components/ui/Dropdown";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { TicketAttachments } from "./TicketAttachments";

interface TicketCommentsProps {
  comments: TicketCommentDto[];
  ticketId: string;
  downloadingAttachmentId?: string | null;
  onDownloadAttachment: (attachment: TicketAttachmentDto) => Promise<void>;
  onEdit?: (comment: TicketCommentDto) => void;
  onDelete?: (comment: TicketCommentDto) => void;
  canManage?: (comment: TicketCommentDto) => boolean;
  canManageAttachment?: (attachment: TicketAttachmentDto) => boolean;
  onEditAttachmentDescription?: (attachment: TicketAttachmentDto) => void;
  onDeleteAttachment?: (attachment: TicketAttachmentDto) => void | Promise<void>;
}

function getCommentStyle(comment: TicketCommentDto) {
  // 1. İç Not (Internal Comment) -> Amber / Sarı
  if (comment.isInternal) {
    return {
      bubbleClass:
        "bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/30 dark:border-amber-500/40 text-stone-900 dark:text-amber-200 rounded-3xl rounded-tl-md shadow-inner",
      roleLabel: "Internal Note",
      badgeClass:
        "bg-amber-500/15 text-amber-800 dark:bg-amber-500/25 dark:text-amber-300 border-amber-600/30 dark:border-amber-400/80",
      isInternal: true,
    };
  }

  const rec = comment as unknown as Record<string, unknown>;
  const rawRole = (
    comment.createdByRole ||
    rec.createdByRole ||
    rec.userRole ||
    rec.role ||
    ""
  )
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();

  // 2. ADMIN -> Amber / Neon Pink
  if (rawRole.includes("admin")) {
    return {
      bubbleClass:
        "bg-purple-500/10 dark:bg-purple-950/30 border-purple-500/30 dark:border-purple-500/40 text-stone-900 dark:text-purple-200 rounded-3xl rounded-tl-md shadow-inner",
      roleLabel: "Admin",
      badgeClass:
        "bg-amber-500/15 text-amber-800 dark:bg-pink-500/25 dark:text-pink-300 border-amber-600/30 dark:border-pink-400/80 dark:shadow-[0_0_12px_rgba(244,114,182,0.35)]",
      isInternal: false,
    };
  }

  // 3. TEAM LEADER -> Kırmızı / Parlak Sarı
  if (rawRole.includes("teamleader") || rawRole.includes("leader")) {
    return {
      bubbleClass:
        "bg-rose-500/10 dark:bg-rose-950/30 border-rose-500/30 dark:border-rose-500/40 text-stone-900 dark:text-rose-200 rounded-3xl rounded-tl-md shadow-inner",
      roleLabel: "Team Leader",
      badgeClass:
        "bg-red-500/15 text-red-800 dark:bg-yellow-400/20 dark:text-yellow-300 border-red-600/30 dark:border-yellow-400/80 dark:shadow-[0_0_12px_rgba(250,204,21,0.35)]",
      isInternal: false,
    };
  }

  // 4. SUPPORT AGENT -> Teal / Mavi
  if (
    rawRole.includes("supportagent") ||
    rawRole.includes("support") ||
    rawRole.includes("agent")
  ) {
    return {
      bubbleClass:
        "bg-blue-500/10 dark:bg-blue-950/30 border-blue-500/30 dark:border-blue-500/40 text-stone-900 dark:text-blue-200 rounded-3xl rounded-tl-md shadow-inner",
      roleLabel: "Support Agent",
      badgeClass:
        "bg-teal-500/15 text-teal-800 dark:bg-blue-500/20 dark:text-blue-300 border-teal-600/30 dark:border-blue-500/40",
      isInternal: false,
    };
  }

  // 5. USER -> Nötr / Siyah-Beyaz (Stone / Slate)
  return {
    bubbleClass:
      "bg-white/90 dark:bg-slate-800/80 border-stone-200/80 dark:border-slate-700 text-stone-900 dark:text-slate-100 rounded-3xl rounded-tl-md shadow-inner",
    roleLabel: "User",
    badgeClass:
      "bg-stone-900/10 text-stone-900 dark:bg-slate-100/15 dark:text-slate-100 border-stone-900/25 dark:border-slate-100/30",
    isInternal: false,
  };
}

export function TicketComments({
  comments,
  ticketId,
  downloadingAttachmentId = null,
  onDownloadAttachment,
  canManage,
  canManageAttachment,
  onEdit,
  onDelete,
  onEditAttachmentDescription,
  onDeleteAttachment,
}: TicketCommentsProps) {
  if (comments.length === 0) {
    return (
      <EmptyState
        description="There is no comment added to this ticket."
        title="No comments"
      />
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => {
        const attachments = comment.attachments ?? [];
        const style = getCommentStyle(comment);
        const showActions = canManage?.(comment) ?? false;

        return (
          <article
            key={comment.id}
            className="flex gap-4 items-start group animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            {/* AVATAR */}
            <div className="shrink-0 mt-0.5">
              <Avatar
                avatarUrl={comment.createdByAvatarUrl}
                name={comment.createdByName}
                size="md"
                className="shadow-md border border-stone-200 dark:border-purple-800/40"
              />
            </div>

            {/* MESAJ İÇERİĞİ VE BALONCUK */}
            <div className="flex flex-col items-start min-w-0 max-w-[88%] sm:max-w-[78%] space-y-2">
              {/* HEADER (Kullanıcı Adı, Rol, Zaman & Aksiyonlar) */}
              <div className="flex items-center gap-2.5 flex-wrap px-1">
                <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white">
                  {comment.createdByName}
                </span>

                {style.roleLabel && (
                  <span
                    className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${style.badgeClass}`}
                  >
                    {style.isInternal && <Lock className="h-3 w-3 inline" />}
                    {style.roleLabel}
                  </span>
                )}

                <time className="text-[10px] font-mono font-medium text-stone-400 dark:text-slate-400">
                  {new Date(comment.createdAt).toLocaleString("tr-TR")}
                  {comment.editedAt && " · edited"}
                </time>

                {showActions && (onEdit || onDelete) && (
                  <Dropdown
                    label={<MoreHorizontal className="h-4 w-4 text-stone-400 dark:text-slate-400 hover:text-stone-700 dark:hover:text-white transition-colors" />}
                    items={[
                      ...(onEdit
                        ? [
                            {
                              id: "edit",
                              label: "Edit comment",
                              onSelect: () => onEdit(comment),
                            },
                          ]
                        : []),
                      ...(onDelete
                        ? [
                            {
                              id: "delete",
                              label: "Delete comment",
                              danger: true,
                              onSelect: () => onDelete(comment),
                            },
                          ]
                        : []),
                    ]}
                  />
                )}
              </div>

              {/* MESAJ BALONCUĞU */}
              <div
                className={`w-fit px-5 py-3.5 text-xs sm:text-sm font-medium border shadow-lg backdrop-blur-2xl transition-all ${style.bubbleClass}`}
              >
                {comment.comment && (
                  <p className="whitespace-pre-wrap leading-relaxed break-words text-stone-900 dark:text-slate-100 font-medium">
                    {comment.comment}
                  </p>
                )}

                {/* EKLER */}
                {attachments.length > 0 && (
                  <div
                    className={
                      comment.comment
                        ? "mt-3.5 border-t border-stone-200/60 dark:border-slate-700/60 pt-3.5"
                        : ""
                    }
                  >
                    <p className="mb-2.5 text-[10px] font-mono font-extrabold uppercase tracking-wider opacity-80 flex items-center gap-1.5 text-stone-500 dark:text-slate-400">
                      <MessageSquare className="h-3 w-3" />
                      <span>{attachments.length} attachment(s)</span>
                    </p>

                    <TicketAttachments
                      attachments={attachments}
                      canManage={canManageAttachment}
                      downloadingAttachmentId={downloadingAttachmentId}
                      onDelete={onDeleteAttachment}
                      onDownload={onDownloadAttachment}
                      onEditDescription={onEditAttachmentDescription}
                      ticketId={ticketId}
                    />
                  </div>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}