"use client";

import type { TicketAttachmentDto } from "@/src/types/ticket-attachment";
import { Button } from "@/src/components/ui/Button";
import { Dropdown } from "@/src/components/ui/Dropdown";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { FileText, Download } from "lucide-react";

interface TicketAttachmentsProps {
  attachments: TicketAttachmentDto[];
  downloadingAttachmentId?: string | null;
  onDownload: (attachment: TicketAttachmentDto) => Promise<void>;
  canManage?: (attachment: TicketAttachmentDto) => boolean;
  onDelete?: (attachment: TicketAttachmentDto) => void | Promise<void>;
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

function isImageFile(fileName?: string, contentType?: string): boolean {
  if (contentType?.startsWith("image/")) return true;
  if (!fileName) return false;
  return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileName);
}

export function TicketAttachments({
  attachments,
  downloadingAttachmentId = null,
  onDownload,
  canManage,
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
    <div className="space-y-2.5">
      {attachments.map((attachment) => {
        const isDownloading = downloadingAttachmentId === attachment.id;
        const showActions = canManage?.(attachment) ?? false;

        const attRecord = attachment as unknown as Record<string, unknown>;
        const imageUrl = (attRecord.fileUrl || attRecord.url || attRecord.filePath || attRecord.path) as string | undefined;
        const isImg = isImageFile(attachment.fileName, attRecord.contentType as string | undefined);

        if (isImg && imageUrl) {
          return (
            <div
              key={attachment.id}
              className="group overflow-hidden rounded-xl border border-white/20 bg-black/20 p-2 text-xs transition-all"
            >
              <div className="relative max-h-64 w-full overflow-hidden rounded-lg bg-black/40 flex items-center justify-center">
                <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                  <img
                    src={imageUrl}
                    alt={attachment.fileName}
                    className="max-h-64 w-full object-contain rounded-lg transition-transform duration-200 group-hover:scale-105"
                  />
                </a>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{attachment.fileName}</p>
                  <p className="text-[11px] opacity-75">
                    {formatFileSize(attachment.fileSize)}
                    {attachment.uploadedByName ? ` · ${attachment.uploadedByName}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    loading={isDownloading}
                    onClick={() => void onDownload(attachment)}
                    size="sm"
                    type="button"
                    variant="secondary"
                    className="h-7 px-2 text-xs"
                  >
                    <Download className="mr-1 h-3 w-3" />
                    {isDownloading ? "..." : "Download"}
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

              {attachment.description && (
                <p className="mt-1 text-xs opacity-75 italic">
                  {attachment.description}
                </p>
              )}
            </div>
          );
        }

        return (
          <div
            key={attachment.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-2.5 text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-xs">
                  {attachment.fileName}
                </p>
                <p className="text-[11px] opacity-75">
                  {formatFileSize(attachment.fileSize)}
                  {attachment.uploadedByName
                    ? ` · ${attachment.uploadedByName}`
                    : ""}
                </p>
                {attachment.description && (
                  <p className="mt-0.5 text-[11px] opacity-75 italic truncate">
                    {attachment.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                loading={isDownloading}
                onClick={() => void onDownload(attachment)}
                size="sm"
                type="button"
                variant="secondary"
                className="h-7 px-2 text-xs"
              >
                <Download className="mr-1 h-3 w-3" />
                {isDownloading ? "..." : "Download"}
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
  );
}