import { TicketCommentDto } from "@/src/types/ticket-comment";
import { Badge } from "@/src/components/ui/Badge";
import { Dropdown } from "@/src/components/ui/Dropdown";
import { EmptyState } from "@/src/components/ui/EmptyState";

export function TicketComments({
  comments,
  onEdit,
  onDelete,
}: {
  comments: TicketCommentDto[];
  onEdit?: (comment: TicketCommentDto) => void;
  onDelete?: (comment: TicketCommentDto) => void;
}) {
  if (comments.length === 0) {
    return (
      <EmptyState
        description="There is no comment added to this ticket."
        title="No comment"
      />
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <article className="chat chat-start" key={comment.id}>
          <div className="chat-header mb-1 flex items-center gap-2">
              <span className="font-semibold">
                {comment.createdByName}
              </span>
              <time className="text-xs opacity-50">
                {new Date(comment.createdAt).toLocaleString("tr-TR")}
                {comment.editedAt && " · düzenlendi"}
              </time>
            {comment.isInternal && <Badge tone="amber">Dahili yorum</Badge>}
            {(onEdit || onDelete) && (
              <Dropdown
                label="•••"
                items={[
                  ...(onEdit
                    ? [{
                        id: "edit",
                        label: "Edit comment",
                        onSelect: () => onEdit(comment),
                      }]
                    : []),
                  ...(onDelete
                    ? [{
                        id: "delete",
                        label: "Delete comment",
                        danger: true,
                        onSelect: () => onDelete(comment),
                      }]
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
          {comment.attachments.length > 0 && (
            <p className="chat-footer mt-1 text-xs opacity-50">
              {comment.attachments.length} Attachment added
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
