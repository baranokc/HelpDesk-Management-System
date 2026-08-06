"use client";

import { useState } from "react";
import { Download, Eye } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Dropdown } from "@/src/components/ui/Dropdown";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { formatAttachmentFileSize } from "@/src/lib/attachmentPresentation";
import type { TicketAttachmentDto } from "@/src/types/ticket-attachment";
import {
  AttachmentFileIcon,
  AttachmentPreviewModal,
} from "./AttachmentPreviewModal";

interface TicketAttachmentsProps {
  attachments: TicketAttachmentDto[];
  ticketId: string;
  downloadingAttachmentId?: string | null;
  onDownload: (attachment: TicketAttachmentDto) => Promise<void>;
  canManage?: (attachment: TicketAttachmentDto) => boolean;
  onDelete?: (attachment: TicketAttachmentDto) => void | Promise<void>;
  onEditDescription?: (attachment: TicketAttachmentDto) => void;
}

export function TicketAttachments({
  attachments,
  ticketId,
  downloadingAttachmentId = null,
  onDownload,
  canManage,
  onDelete,
  onEditDescription,
}: TicketAttachmentsProps) {
  const [previewAttachment, setPreviewAttachment] =
    useState<TicketAttachmentDto | null>(null);

  if (attachments.length === 0) {
    return (
      <EmptyState
        description="There are no attachments."
        title="No files"
      />
    );
  }

  return (
    <>
      <div className="space-y-2.5">
        {attachments.map((attachment) => {
          const isDownloading = downloadingAttachmentId === attachment.id;
          const showActions = canManage?.(attachment) ?? false;

          return (
            <div
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-2.5 text-xs transition-colors hover:border-blue-400/50 hover:bg-black/30"
              key={attachment.id}
            >
              <button
                aria-label={`Preview ${attachment.fileName}`}
                className="group flex min-w-0 flex-1 items-center gap-2.5 text-left"
                onClick={() => setPreviewAttachment(attachment)}
                type="button"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 transition-colors group-hover:bg-white/15">
                  <AttachmentFileIcon attachment={attachment} className="h-5 w-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-xs font-medium underline-offset-2 group-hover:underline">
                      {attachment.fileName}
                    </span>
                    <Eye
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 opacity-60"
                    />
                  </span>

                  <span className="block text-[11px] opacity-75">
                    {formatAttachmentFileSize(attachment.fileSize)}
                    {attachment.uploadedByName
                      ? ` · ${attachment.uploadedByName}`
                      : ""}
                  </span>

                  {attachment.description && (
                    <span className="mt-0.5 block truncate text-[11px] italic opacity-75">
                      {attachment.description}
                    </span>
                  )}
                </span>
              </button>

              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  className="h-8 !border-blue-500 !bg-blue-600 px-2.5 text-xs font-semibold !text-white shadow-sm hover:!border-blue-400 hover:!bg-blue-500 dark:!border-blue-400 dark:!bg-blue-500 dark:hover:!bg-blue-400"
                  loading={isDownloading}
                  onClick={() => void onDownload(attachment)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <Download aria-hidden="true" className="h-3.5 w-3.5" />
                  Download
                </Button>

                {showActions && (onDelete || onEditDescription) && (
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
            </div>
          );
        })}
      </div>

      {previewAttachment && (
        <AttachmentPreviewModal
          attachment={previewAttachment}
          downloading={downloadingAttachmentId === previewAttachment.id}
          onClose={() => setPreviewAttachment(null)}
          onDownload={onDownload}
          ticketId={ticketId}
        />
      )}
    </>
  );
}
