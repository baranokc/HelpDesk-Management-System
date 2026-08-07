"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { UploadCloud, FileText, Paperclip, X, ArrowRight } from "lucide-react";
import { ticketAttachmentCreateSchema } from "@/src/schemas/attachmentSchemas";
import { getFormErrors } from "@/src/lib/validation";
import type { FormErrors } from "@/src/lib/validation";
import { Button } from "@/src/components/ui/Button";
import type { TicketAttachmentCreateDto } from "@/src/types/ticket-attachment";

interface AttachmentUploaderProps {
  loading?: boolean;
  onUpload: (dto: TicketAttachmentCreateDto) => Promise<void>;
}

export function AttachmentUploader({
  loading = false,
  onUpload,
}: AttachmentUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [validationErrors, setValidationErrors] = useState<FormErrors>({});

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).slice(0, 10);
    setFiles(selected);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = ticketAttachmentCreateSchema.safeParse({
      files,
      description,
      commentId: null,
    });

    if (!result.success) {
      setValidationErrors(getFormErrors(result.error));
      return;
    }

    setValidationErrors({});

    try {
      await onUpload(result.data);
    } catch {
      return;
    }

    setFiles([]);
    setDescription("");
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      {/* DRAG & DROP AREA */}
      <div className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 transition-all cursor-pointer group">
        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf,.txt,.docx,.xlsx,.zip,.rar,.7z"
          onChange={handleFileSelect}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform mb-2">
          <UploadCloud className="h-6 w-6" />
        </div>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
          Click or drag files to upload
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          JPG, PNG, PDF, DOCX, ZIP up to 10MB each
        </p>
      </div>

      {validationErrors.files && (
        <p className="text-[11px] font-medium text-rose-500">{validationErrors.files}</p>
      )}

      {/* SEÇİLEN DOSYA LİSTESİ */}
      {files.length > 0 && (
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs"
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <Paperclip className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                  {file.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  ({(file.size / (1024 * 1024)).toFixed(1)}MB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="text-slate-400 hover:text-rose-500 transition-colors p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* AÇIKLAMA INPUTI */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <FileText className="h-3.5 w-3.5 text-indigo-500" />
          <span>File Description</span>
        </label>
        <input
          type="text"
          maxLength={100}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of these files... (optional)"
          className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
        {validationErrors.description && (
          <p className="text-[11px] font-medium text-rose-500">{validationErrors.description}</p>
        )}
      </div>

      {/* SUBMIT */}
      <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <Button
          disabled={files.length === 0}
          loading={loading}
          type="submit"
          className="!inline-flex !items-center !gap-2 !px-5 !py-2.5 !rounded-xl !text-xs !font-bold !text-white !bg-gradient-to-r !from-indigo-600 !to-violet-600 hover:!from-indigo-500 hover:!to-violet-500 shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:!opacity-40"
        >
          <span>Upload Files</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </form>
  );
}