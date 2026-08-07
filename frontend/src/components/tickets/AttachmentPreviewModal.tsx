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
  Loader2,
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
    return <FileImage aria-hidden="true" className={`${className} text-emerald-700 dark:text-purple-400`} />;
  }

  if (kind === "pdf") {
    return <FileText aria-hidden="true" className={`${className} text-rose-600 dark:text-rose-400`} />;
  }

  if (kind === "archive") {
    return <FileArchive aria-hidden="true" className={`${className} text-amber-600 dark:text-amber-400`} />;
  }

  if (kind === "word") {
    return <FileType2 aria-hidden="true" className={`${className} text-teal-700 dark:text-indigo-400`} />;
  }

  if (kind === "spreadsheet") {
    return (
      <FileSpreadsheet
        aria-hidden="true"
        className={`${className} text-emerald-600 dark:text-emerald-400`}
      />
    );
  }

  if (kind === "text") {
    return <FileText aria-hidden="true" className={`${className} text-stone-500 dark:text-slate-400`} />;
  }

  return <File aria-hidden="true" className={`${className} text-stone-500 dark:text-slate-400`} />;
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
        {/* FILE INFO HEADER */}
        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-stone-500 dark:text-slate-400">
          <span className="font-mono">{formatAttachmentFileSize(attachment.fileSize)}</span>
          {extension && (
            <span className="rounded-lg border border-stone-300 dark:border-purple-800/40 bg-stone-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-extrabold font-mono text-emerald-800 dark:text-purple-300">
              {extension}
            </span>
          )}
        </div>

        {/* PREVIEW CONTAINER */}
        <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-2xl border border-stone-200/80 dark:border-purple-900/40 bg-stone-100/60 dark:bg-slate-950/60 backdrop-blur-xl">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-xs font-bold text-stone-500 dark:text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-700 dark:text-purple-400" />
              <span>Loading preview...</span>
            </div>
          )}

          {!loading && error && (
            <div className="max-w-sm space-y-3 px-6 py-10 text-center">
              <AttachmentFileIcon attachment={attachment} className="mx-auto h-16 w-16" />
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
            </div>
          )}

          {!loading && !error && kind === "image" && previewUrl && (
            // Blob URLs require the native image element; Next Image cannot optimize them.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={attachment.fileName}
              className="max-h-[60vh] w-full object-contain p-2 rounded-xl"
              src={previewUrl}
            />
          )}

          {!loading && !error && kind === "pdf" && previewUrl && (
            <object
              aria-label={`${attachment.fileName} preview`}
              className="h-[60vh] min-h-96 w-full rounded-xl"
              data={previewUrl}
              type="application/pdf"
            >
              <div className="space-y-3 px-6 py-10 text-center">
                <AttachmentFileIcon attachment={attachment} className="mx-auto h-16 w-16" />
                <p className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                  PDF preview is not supported by this browser.
                </p>
              </div>
            </object>
          )}

          {!canRenderContent && (
            <div className="space-y-4 px-6 py-10 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-stone-200/80 dark:border-purple-800/40 bg-white dark:bg-slate-900 shadow-md">
                <AttachmentFileIcon attachment={attachment} className="h-12 w-12" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-800 dark:text-slate-100">
                  {extension ? `${extension} file` : "File attachment"}
                </p>
                <p className="mt-1 text-[11px] font-medium text-stone-500 dark:text-slate-400">
                  This file type cannot be previewed in the browser.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* DESCRIPTION */}
        {attachment.description && (
          <p className="rounded-xl bg-stone-100/80 dark:bg-slate-800/80 border border-stone-200/60 dark:border-slate-700/60 px-3.5 py-2.5 text-xs font-medium text-stone-700 dark:text-slate-300">
            {attachment.description}
          </p>
        )}

        {/* ACTIONS */}
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          {previewUrl && (
            <Button
              onClick={openInNewTab}
              size="sm"
              variant="secondary"
              className="!inline-flex !items-center !gap-1.5 !px-4 !py-2 !rounded-xl !text-xs !font-bold !text-stone-700 dark:!text-slate-200 !bg-stone-100 dark:!bg-slate-800 border-stone-300 dark:border-slate-700 hover:!bg-stone-200 dark:hover:!bg-slate-700 transition-all shadow-sm"
            >
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Open</span>
            </Button>
          )}

          <Button
            loading={downloading}
            onClick={() => void onDownload(attachment)}
            size="sm"
            variant="primary"
            className="!inline-flex !items-center !gap-1.5 !px-5 !py-2 !rounded-xl !text-xs !font-bold !text-white !bg-gradient-to-r !from-emerald-600 !to-teal-700 dark:!from-purple-600 dark:!to-indigo-600 hover:!from-emerald-500 hover:!to-teal-600 dark:hover:!from-purple-500 dark:hover:!to-indigo-500 shadow-lg shadow-emerald-700/20 dark:shadow-purple-600/25 active:scale-95 transition-all"
          >
            <Download aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Download</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}