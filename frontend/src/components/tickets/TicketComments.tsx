"use client";

import type { TicketAttachmentDto } from "@/src/types/ticket-attachment";
import type { TicketCommentDto } from "@/src/types/ticket-comment";
import { Badge } from "@/src/components/ui/Badge";
import { Dropdown } from "@/src/components/ui/Dropdown";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { TicketAttachments } from "./TicketAttachments";

interface TicketCommentsProps {
  comments: TicketCommentDto[];
  downloadingAttachmentId?: string | null;
  onDownloadAttachment: (
    attachment: TicketAttachmentDto,
  ) => Promise<void>;
  onEdit?: (comment: TicketCommentDto) => void;
  onDelete?: (comment: TicketCommentDto) => void;
}

function getCommentStyle(comment: TicketCommentDto) {
  // 1. İç Not (Internal Comment) her zaman belirgin Amber / Sarı
  if (comment.isInternal) {
    return {
      bubbleClass: "bg-amber-900 text-amber-50 border border-amber-600 shadow-sm",
      roleLabel: "Internal Note",
      badgeTone: "amber" as const,
    };
  }

  const commentRecord = comment as unknown as Record<string, unknown>;
  const role = (
    commentRecord.userRole ||
    commentRecord.authorRole ||
    commentRecord.role ||
    commentRecord.createdByRole ||
    ""
  ).toString().toLowerCase();

  const name = (comment.createdByName || "").toLowerCase();

  // 2. Admin Kontrolü (Rol veya İsimden)
  if (role.includes("admin") || name.includes("admin")) {
    return {
      bubbleClass: "bg-indigo-900 text-indigo-50 border border-indigo-600 shadow-sm",
      roleLabel: "Admin",
      badgeTone: "purple" as const,
    };
  }

  // 3. Support / TeamMember Kontrolü
  if (
    role.includes("agent") ||
    role.includes("support") ||
    role.includes("team") ||
    name.includes("support")
  ) {
    return {
      bubbleClass: "bg-blue-900 text-blue-50 border border-blue-600 shadow-sm",
      roleLabel: "Support",
      badgeTone: "blue" as const,
    };
  }

  // 4. Standart / Müşteri Yorumları (Koyu Gri)
  return {
    bubbleClass: "bg-slate-800 text-slate-100 border border-slate-700 shadow-sm",
    roleLabel: role ? "Customer" : null,
    badgeTone: "slate" as const,
  };
}

export function TicketComments({
  comments,
  downloadingAttachmentId = null,
  onDownloadAttachment,
  onEdit,
  onDelete,
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

        return (
          <article className="chat chat-start" key={comment.id}>
            <div className="chat-header mb-1.5 flex items-center gap-2">
              {/* KULLANICI ADI SİMSİYAH (text-slate-900) YAPILDI */}
              <span className="font-bold text-slate-900">
                {comment.createdByName}
              </span>

              {/* Rol Etiketi */}
              {style.roleLabel && (
                <Badge tone={style.badgeTone}>{style.roleLabel}</Badge>
              )}

              {/* TARİH METNİ DE NETLEŞTİRİLDİ */}
              <time className="text-xs font-medium text-slate-600">
                {new Date(comment.createdAt).toLocaleString("tr-TR")}
                {comment.editedAt && " · edited"}
              </time>

              {(onEdit || onDelete) && (
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

            {/* Mesaj Baloncuğu */}
            <div
              className={`chat-bubble max-w-2xl whitespace-pre-wrap rounded-2xl p-4 text-sm font-medium ${style.bubbleClass}`}
            >
              {comment.comment}
            </div>

            {attachments.length > 0 && (
              <div className="mt-3 w-full max-w-2xl">
                <p className="mb-2 text-xs font-semibold text-slate-600">
                  {attachments.length} attachment(s)
                </p>

                <TicketAttachments
                  attachments={attachments}
                  downloadingAttachmentId={downloadingAttachmentId}
                  onDownload={onDownloadAttachment}
                />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}