"use client";

import { Lock, MessageSquare, MoreHorizontal } from "lucide-react";
import type { TicketAttachmentDto } from "@/src/types/ticket-attachment";
import type { TicketCommentDto } from "@/src/types/ticket-comment";
import { Avatar } from "@/src/components/ui/Avatar";
import { Badge } from "@/src/components/ui/Badge";
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
        "bg-amber-500/10 dark:bg-amber-950/40 border-amber-500/30 dark:border-amber-500/40 text-stone-800 dark:text-amber-100 rounded-2xl rounded-tl-sm",
      roleLabel: "Internal Note",
      badgeTone: "amber" as const,
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

  // 2. ADMIN -> Mor / Violet
  if (rawRole.includes("admin")) {
    return {
      bubbleClass:
        "bg-purple-500/10 dark:bg-purple-950/40 border-purple-500/30 dark:border-purple-500/40 text-stone-800 dark:text-purple-100 rounded-2xl rounded-tl-sm",
      roleLabel: "Admin",
      badgeTone: "purple" as const,
      isInternal: false,
    };
  }

  // 3. TEAM LEADER -> Rose / Kırmızı
  if (rawRole.includes("teamleader") || rawRole.includes("leader")) {
    return {
      bubbleClass:
        "bg-rose-500/10 dark:bg-rose-950/40 border-rose-500/30 dark:border-rose-500/40 text-stone-800 dark:text-rose-100 rounded-2xl rounded-tl-sm",
      roleLabel: "Team Leader",
      badgeTone: "red" as const,
      isInternal: false,
    };
  }

  // 4. SUPPORT AGENT -> Mavi / İndigo
  if (
    rawRole.includes("supportagent") ||
    rawRole.includes("support") ||
    rawRole.includes("agent")
  ) {
    return {
      bubbleClass:
        "bg-blue-500/10 dark:bg-blue-950/40 border-blue-500/30 dark:border-blue-500/40 text-stone-800 dark:text-blue-100 rounded-2xl rounded-tl-sm",
      roleLabel: "Support Agent",
      badgeTone: "blue" as const,
      isInternal: false,
    };
  }

  // 5. USER -> Yeşil / Nötr
  return {
    bubbleClass:
      "bg-emerald-500/10 dark:bg-slate-900/90 border-emerald-600/20 dark:border-purple-900/40 text-stone-800 dark:text-slate-100 rounded-2xl rounded-tl-sm",
    roleLabel: "User",
    badgeTone: "green" as const,
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
    <div className="space-y-5">
      {comments.map((comment) => {
        const attachments = comment.attachments ?? [];
        const style = getCommentStyle(comment);
        const showActions = canManage?.(comment) ?? false;

        return (
          <article
            key={comment.id}
            className="flex gap-3 items-start group animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            {/* AVATAR */}
            <div className="shrink-0 mt-1">
              <Avatar
                avatarUrl={comment.createdByAvatarUrl}
                name={comment.createdByName}
                size="sm"
                className="shadow-sm border border-stone-200 dark:border-purple-800/40"
              />
            </div>

            {/* MESAJ İÇERİĞİ VE BALONCUK (WHATSAPP TARZI DİNAMİK GENİŞLİK) */}
            <div className="flex flex-col items-start min-w-0 max-w-[85%] sm:max-w-[75%] space-y-1">
              {/* HEADER (Kullanıcı Adı, Rol, Zaman & Aksiyonlar) */}
              <div className="flex items-center gap-2 flex-wrap px-1">
                <span className="font-bold text-xs text-stone-900 dark:text-slate-100">
                  {comment.createdByName}
                </span>

                {style.roleLabel && (
                  <Badge tone={style.badgeTone}>
                    {style.isInternal && (
                      <Lock className="h-3 w-3 mr-1 inline" />
                    )}
                    {style.roleLabel}
                  </Badge>
                )}

                <time className="text-[10px] font-medium text-stone-400 dark:text-slate-400 font-mono">
                  {new Date(comment.createdAt).toLocaleString("tr-TR")}
                  {comment.editedAt && " · edited"}
                </time>

                {showActions && (onEdit || onDelete) && (
                  <Dropdown
                    label={<MoreHorizontal className="h-3.5 w-3.5 text-stone-400 dark:text-slate-400 hover:text-stone-700 dark:hover:text-white" />}
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

              {/* WHATSAPP BALONCUĞU (`w-fit` KULLANILARAK METİN UZUNLUĞUNA GÖRE BOYUTLANIR) */}
              <div
                className={`w-fit px-4 py-3 text-xs sm:text-sm font-medium border shadow-md backdrop-blur-2xl transition-all ${style.bubbleClass}`}
              >
                {comment.comment && (
                  <p className="whitespace-pre-wrap leading-relaxed break-words">
                    {comment.comment}
                  </p>
                )}

                {/* EKLER */}
                {attachments.length > 0 && (
                  <div
                    className={
                      comment.comment
                        ? "mt-2.5 border-t border-stone-200/60 dark:border-slate-700/60 pt-2.5"
                        : ""
                    }
                  >
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
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