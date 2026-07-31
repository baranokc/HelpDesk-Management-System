"use client";

import type { TicketAttachmentDto } from "@/src/types/ticket-attachment";
import { Button } from "@/src/components/ui/Button";
import { Dropdown } from "@/src/components/ui/Dropdown";
import { EmptyState } from "@/src/components/ui/EmptyState";

interface TicketAttachmentsProps {
  attachments: TicketAttachmentDto[];
  downloadingAttachmentId?: string | null;
  onDownload: (attachment: TicketAttachmentDto) => Promise<void>;
  onDelete?: (attachment: TicketAttachmentDto) => Promise<void>;
  onEditDescription?: (attachment: TicketAttachmentDto) => void;
}

function formatFileSize(fileSize: number): string {
  if (fileSize < 1024) {
    return `${fileSize} B`;
  }

  if (fileSize < 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(1)} KB`;
  }

  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
}

export function TicketAttachments({
  attachments,
  downloadingAttachmentId = null,
  onDownload,
  onDelete,
  onEditDescription,
}: TicketAttachmentsProps) {
  if (attachments.length === 0) {
    return (
      <EmptyState
        description="There are no attachments."
        title="No files"
      />
    );
  }

  return (
    <ul className="list rounded-box border border-base-300 bg-base-100">
      {attachments.map((attachment) => {
        const isDownloading = downloadingAttachmentId === attachment.id;

        return (
          <li className="list-row" key={attachment.id}>
            <div className="list-col-grow min-w-0">
              <p className="truncate text-sm font-medium">
                {attachment.fileName}
              </p>

              <p className="text-xs opacity-50">
                {formatFileSize(attachment.fileSize)}
                {attachment.uploadedByName
                  ? ` · ${attachment.uploadedByName}`
                  : ""}
              </p>

              {attachment.description && (
                <p className="mt-1 text-xs opacity-60">
                  {attachment.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                loading={isDownloading}
                onClick={() => void onDownload(attachment)}
                size="sm"
                type="button"
                variant="secondary"
              >
                {isDownloading ? "Downloading..." : "Download"}
              </Button>

              {(onDelete || onEditDescription) && (
                <Dropdown
                  label="Update"
                  items={[
                    ...(onEditDescription
                      ? [
                          {
                            id: "edit-description",
                            label: "Edit description",
                            onSelect: () => onEditDescription(attachment),
                          },
                        ]
                      : []),
                    ...(onDelete
                      ? [
                          {
                            id: "delete",
                            label: "Delete file",
                            danger: true,
                            onSelect: () => void onDelete(attachment),
                          },
                        ]
                      : []),
                  ]}
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
