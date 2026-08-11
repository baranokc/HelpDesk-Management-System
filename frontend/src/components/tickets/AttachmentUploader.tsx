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

const MAX_FILE_COUNT = 10;

const getFileKey = (file: File) =>
  `${file.name}-${file.size}-${file.lastModified}`;

export function AttachmentUploader({
  loading = false,
  onUpload,
}: AttachmentUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [validationErrors, setValidationErrors] = useState<FormErrors>({});

  const addFiles = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    const existingFileKeys = new Set(files.map(getFileKey));
    const newFiles = selectedFiles.filter((file) => {
      const fileKey = getFileKey(file);

      if (existingFileKeys.has(fileKey)) return false;

      existingFileKeys.add(fileKey);
      return true;
    });

    const availableSlots = MAX_FILE_COUNT - files.length;
    const filesToAdd = newFiles.slice(0, availableSlots);
    const rejectedFileCount = newFiles.length - filesToAdd.length;

    setFiles((prev) => [...prev, ...filesToAdd]);
    setValidationErrors((prev) => ({
      ...prev,
      files:
        rejectedFileCount > 0
          ? `You can upload a maximum of ${MAX_FILE_COUNT} files. ${rejectedFileCount} file${rejectedFileCount === 1 ? " was" : "s were"} not added.`
          : undefined,
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));

    // Aynı dosyanın silindikten sonra yeniden seçilebilmesini sağlar.
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setValidationErrors((prev) => ({ ...prev, files: undefined }));
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
      <div className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-300 dark:border-purple-900/50 hover:border-emerald-600/60 dark:hover:border-purple-500/60 rounded-2xl bg-stone-50/50 dark:bg-slate-900/50 transition-all cursor-pointer group">
        <input
          type="file"
          multiple
          disabled={files.length >= MAX_FILE_COUNT || loading}
          accept=".jpg,.jpeg,.png,.pdf,.txt,.docx,.xlsx,.zip,.rar,.7z"
          onChange={handleFileSelect}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed w-full h-full z-10"
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 dark:bg-purple-500/20 text-emerald-700 dark:text-purple-300 group-hover:scale-110 transition-transform mb-2 border border-emerald-500/20 dark:border-purple-500/30">
          <UploadCloud className="h-6 w-6" />
        </div>
        <p className="text-xs font-bold text-stone-800 dark:text-slate-200">
          Click or drag files to upload
        </p>
        <p className="text-[10px] text-stone-500 dark:text-slate-400 mt-0.5">
          JPG, PNG, PDF, DOCX, ZIP up to 10MB each
        </p>
        <p className="text-[10px] font-semibold text-emerald-700 dark:text-purple-300 mt-1">
          {files.length}/{MAX_FILE_COUNT} files selected
        </p>
      </div>

      {validationErrors.files && (
        <p className="text-[11px] font-medium text-rose-500">
          {validationErrors.files}
        </p>
      )}

      {/* SEÇİLEN DOSYA LİSTESİ */}
      {files.length > 0 && (
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {files.map((file, idx) => (
            <div
              key={getFileKey(file)}
              className="flex items-center justify-between p-2 rounded-xl bg-stone-100/90 dark:bg-slate-900/80 border border-stone-200 dark:border-purple-900/40 text-xs"
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <Paperclip className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-purple-400" />
                <span className="truncate font-medium text-stone-800 dark:text-slate-200">
                  {file.name}
                </span>
                <span className="text-[10px] text-stone-400 dark:text-slate-500 font-mono">
                  ({(file.size / (1024 * 1024)).toFixed(1)}MB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="text-stone-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* AÇIKLAMA INPUTI */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-slate-300">
          <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>File Description</span>
        </label>
        <input
          type="text"
          maxLength={100}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of these files... (optional)"
          className="w-full rounded-xl border border-stone-300/80 dark:border-purple-900/40 bg-stone-50/70 dark:bg-slate-900/80 px-3.5 py-2.5 text-xs text-stone-800 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 shadow-inner focus:border-emerald-600 dark:focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-purple-500/20 transition-all"
        />
        {validationErrors.description && (
          <p className="text-[11px] font-medium text-rose-500">
            {validationErrors.description}
          </p>
        )}
      </div>

      {/* SUBMIT */}
      <div className="flex justify-end pt-3 border-t border-stone-200/80 dark:border-slate-800/80">
        <Button
          disabled={files.length === 0 || loading}
          loading={loading}
          type="submit"
          className="!inline-flex !items-center !gap-2 !px-5 !py-2.5 !rounded-xl !text-xs !font-bold !text-white !bg-gradient-to-r !from-emerald-600 !to-teal-700 dark:!from-purple-600 dark:!to-indigo-600 hover:!from-emerald-500 hover:!to-teal-600 dark:hover:!from-purple-500 dark:hover:!to-indigo-500 shadow-md shadow-emerald-700/20 dark:shadow-purple-600/30 active:scale-[0.98] transition-all disabled:!opacity-40"
        >
          <span>Upload Files</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </form>
  );
}