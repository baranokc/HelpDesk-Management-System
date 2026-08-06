"use client";

import { useEffect, useState } from "react";
import {
  Download,
  ExternalLink,
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType2,
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { getApiErrorMessage } from "@/src/lib/api";
import {
  formatAttachmentFileSize,
  getAttachmentKind,
  getFileExtension,
  getPreviewContentType,
} from "@/src/lib/attachmentPresentation";
import { ticketAttachmentService } from "@/src/services/ticketAttachmentService";
import type { TicketAttachmentDto } from "@/src/types/ticket-attachment";

interface AttachmentPreviewModalProps {
  attachment: TicketAttachmentDto;
  ticketId: string;
  downloading?: boolean;
  onClose: () => void;
  onDownload: (attachment: TicketAttachmentDto) => Promise<void>;
}

interface AttachmentFileIconProps {
  attachment: TicketAttachmentDto;
  className?: string;
}

export function AttachmentFileIcon({
  attachment,
  className = "h-5 w-5",
}: AttachmentFileIconProps) {
  const kind = getAttachmentKind(attachment);

  if (kind === "image") {
    return <FileImage aria-hidden="true" className={`${className} text-violet-400`} />;
  }

  if (kind === "pdf") {
    return <FileText aria-hidden="true" className={`${className} text-red-400`} />;
  }

  if (kind === "archive") {
    return <FileArchive aria-hidden="true" className={`${className} text-amber-400`} />;
  }

  if (kind === "word") {
    return <FileType2 aria-hidden="true" className={`${className} text-blue-400`} />;
  }

  if (kind === "spreadsheet") {
    return (
      <FileSpreadsheet
        aria-hidden="true"
        className={`${className} text-emerald-400`}
      />
    );
  }

  if (kind === "text") {
    return <FileText aria-hidden="true" className={`${className} text-slate-400`} />;
  }

  return <File aria-hidden="true" className={`${className} text-slate-400`} />;
}

export function AttachmentPreviewModal({
  attachment,
  ticketId,
  downloading = false,
  onClose,
  onDownload,
}: AttachmentPreviewModalProps) {
  const kind = getAttachmentKind(attachment);
  const canRenderContent = kind === "image" || kind === "pdf";
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(canRenderContent);
  const [error, setError] = useState<string | null>(null);
  const extension = getFileExtension(attachment.fileName).toUpperCase();

  useEffect(() => {
    if (!canRenderContent) return;

    const controller = new AbortController();
    let objectUrl: string | null = null;

    const loadPreview = async () => {
      try {
        const blob = await ticketAttachmentService.getPreviewBlob(
          ticketId,
          attachment.id,
          controller.signal,
        );
        const previewBlob = new Blob([blob], {
          type: getPreviewContentType(attachment, kind),
        });

        objectUrl = window.URL.createObjectURL(previewBlob);
        setPreviewUrl(objectUrl);
      } catch (requestError: unknown) {
        if (controller.signal.aborted) return;

        setError(
          getApiErrorMessage(
            requestError,
            "The attachment preview could not be loaded.",
          ),
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadPreview();

    return () => {
      controller.abort();

      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [attachment, canRenderContent, kind, ticketId]);

  const openInNewTab = () => {
    if (!previewUrl) return;
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Modal onClose={onClose} open title={attachment.fileName}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>{formatAttachmentFileSize(attachment.fileSize)}</span>
          {extension && (
            <span className="rounded-md border border-slate-300 px-2 py-1 font-semibold dark:border-slate-700">
              {extension}
            </span>
          )}
        </div>

        <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-950">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span className="loading loading-spinner loading-md" />
              Loading preview...
            </div>
          )}

          {!loading && error && (
            <div className="max-w-sm space-y-3 px-6 py-10 text-center">
              <AttachmentFileIcon attachment={attachment} className="mx-auto h-16 w-16" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && kind === "image" && previewUrl && (
            // Blob URLs require the native image element; Next Image cannot optimize them.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={attachment.fileName}
              className="max-h-[60vh] w-full object-contain"
              src={previewUrl}
            />
          )}

          {!loading && !error && kind === "pdf" && previewUrl && (
            <object
              aria-label={`${attachment.fileName} preview`}
              className="h-[60vh] min-h-96 w-full"
              data={previewUrl}
              type="application/pdf"
            >
              <div className="space-y-3 px-6 py-10 text-center">
                <AttachmentFileIcon attachment={attachment} className="mx-auto h-16 w-16" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  PDF preview is not supported by this browser.
                </p>
              </div>
            </object>
          )}

          {!canRenderContent && (
            <div className="space-y-4 px-6 py-10 text-center">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <AttachmentFileIcon attachment={attachment} className="h-16 w-16" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {extension ? `${extension} file` : "File attachment"}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  This file type cannot be previewed in the browser.
                </p>
              </div>
            </div>
          )}
        </div>

        {attachment.description && (
          <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {attachment.description}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          {previewUrl && (
            <Button onClick={openInNewTab} size="sm" variant="secondary">
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              Open
            </Button>
          )}

          <Button
            loading={downloading}
            onClick={() => void onDownload(attachment)}
            size="sm"
            variant="primary"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
    </Modal>
  );
}
