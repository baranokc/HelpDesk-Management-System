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

        return (
          <article className="chat chat-start" key={comment.id}>
            <div className="chat-header mb-1 flex items-center gap-2">
              <span className="font-semibold">
                {comment.createdByName}
              </span>

              <time className="text-xs opacity-50">
                {new Date(comment.createdAt).toLocaleString("tr-TR")}
                {comment.editedAt && " · edited"}
              </time>

              {comment.isInternal && (
                <Badge tone="amber">Internal comment</Badge>
              )}

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

            <div
              className={`chat-bubble whitespace-pre-wrap ${
                comment.isInternal
                  ? "chat-bubble-warning"
                  : "chat-bubble-neutral"
              }`}
            >
              {comment.comment}
            </div>

            {attachments.length > 0 && (
              <div className="mt-3 w-full max-w-2xl">
                <p className="mb-2 text-xs font-semibold text-slate-500">
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
