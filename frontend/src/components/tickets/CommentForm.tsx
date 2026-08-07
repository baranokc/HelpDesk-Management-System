"use client";

import { useState } from "react";
import { Send, Lock, Loader2 } from "lucide-react";
import { FileInput } from "@/src/components/ui/FileInput";
import type { TicketCommentCreateDto } from "@/src/types/ticket-comment";

interface CommentFormProps {
  onSubmit: (dto: TicketCommentCreateDto) => Promise<void>;
  loading?: boolean;
  canCreateInternal?: boolean;
}

export function CommentForm({
  onSubmit,
  loading = false,
  canCreateInternal = false,
}: CommentFormProps) {
  const [commentText, setCommentText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    await onSubmit({
      comment: commentText,
      isInternal,
      attachments: files,
    });

    setCommentText("");
    setIsInternal(false);
    setFiles([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300">
            New Comment
          </label>
          <span className="text-[10px] font-mono text-stone-400 dark:text-purple-300/50">
            {commentText.length} / 1000 characters
          </span>
        </div>

        <textarea
          rows={4}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write your response..."
          maxLength={1000}
          required
          className="w-full rounded-2xl border border-stone-300/80 dark:border-purple-800/40 bg-stone-50/60 dark:bg-slate-950/60 p-3.5 text-xs font-medium text-stone-800 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:border-emerald-600 dark:focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:focus:ring-purple-500/20 transition-all resize-y min-h-[100px]"
        />
      </div>

      <FileInput
        accept=".jpg,.jpeg,.png,.pdf,.txt,.docx,.xlsx,.zip,.rar,.7z"
        files={files}
        label="Files"
        maxFiles={10}
        maxFileSizeMb={10}
        multiple
        onChange={setFiles}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        {canCreateInternal ? (
          <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-500/30 transition-all hover:bg-amber-500/20">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-amber-600 bg-amber-900 text-amber-600 focus:ring-amber-500"
            />
            <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span>Internal note (Support staff only)</span>
          </label>
        ) : (
          <div />
        )}

        <button
          type="submit"
          disabled={loading || !commentText.trim()}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-purple-600 dark:to-indigo-600 hover:from-emerald-500 hover:to-teal-600 dark:hover:from-purple-500 dark:hover:to-indigo-500 shadow-lg shadow-emerald-700/20 dark:shadow-purple-600/25 active:scale-[0.98] transition-all disabled:opacity-50 ml-auto"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Adding...</span>
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              <span>Add comment</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}