"use client";

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
      bubbleClass: "bg-amber-950/80 text-amber-50 border border-amber-600/70 shadow-sm",
      roleLabel: "Internal Note",
      badgeTone: "amber" as const,
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

  // 2. ADMIN -> Mor
  if (rawRole.includes("admin")) {
    return {
      bubbleClass: "bg-indigo-950/80 text-indigo-50 border border-indigo-500/50 shadow-sm",
      roleLabel: "Admin",
      badgeTone: "purple" as const,
    };
  }

  // 3. TEAM LEADER -> Kırmızı (Kırmızı Baloncuk & Kırmızı Rozet)
  if (rawRole.includes("teamleader") || rawRole.includes("leader")) {
    return {
      bubbleClass: "bg-red-950/80 text-red-50 border border-red-500/50 shadow-sm",
      roleLabel: "Team Leader",
      badgeTone: "red" as const,
    };
  }

  // 4. SUPPORT AGENT -> Mavi / Gök Mavisi
  if (
    rawRole.includes("supportagent") ||
    rawRole.includes("support") ||
    rawRole.includes("agent")
  ) {
    return {
      bubbleClass: "bg-sky-950/80 text-sky-50 border border-sky-500/50 shadow-sm",
      roleLabel: "Support Agent",
      badgeTone: "blue" as const,
    };
  }

  // 5. USER -> Gri
  return {
    bubbleClass: "bg-slate-800/90 text-slate-100 border border-slate-700 shadow-sm",
    roleLabel: "User",
    badgeTone: "slate" as const,
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
          <article className="chat chat-start" key={comment.id}>
            <div className="chat-image avatar">
              <Avatar
                avatarUrl={comment.createdByAvatarUrl}
                name={comment.createdByName}
                size="md"
              />
            </div>
            <div className="chat-header mb-1.5 flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">
                {comment.createdByName}
              </span>

              {style.roleLabel && (
                <Badge tone={style.badgeTone}>{style.roleLabel}</Badge>
              )}

              <time className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {new Date(comment.createdAt).toLocaleString("tr-TR")}
                {comment.editedAt && " · edited"}
              </time>

              {showActions && (onEdit || onDelete) && (
                <Dropdown
                  label="•••"
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

            <div
              className={`chat-bubble max-w-2xl rounded-2xl p-4 text-sm font-medium ${style.bubbleClass}`}
            >
              {comment.comment && (
                <p className="whitespace-pre-wrap leading-relaxed">
                  {comment.comment}
                </p>
              )}

              {attachments.length > 0 && (
                <div className={comment.comment ? "mt-3 border-t border-white/10 pt-3" : ""}>
                  <p className="mb-2 text-xs font-semibold opacity-80">
                    {attachments.length} attachment(s)
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
          </article>
        );
      })}
    </div>
  );
}
