"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/Button";
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
  const [files, setFiles] = useState<FileList | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    await onSubmit({
      comment: commentText,
      isInternal,
      attachments: files ? Array.from(files) : [],
    });

    setCommentText("");
    setIsInternal(false);
    setFiles(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-300">
          New Comment
        </label>
        <textarea
          rows={4}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write your response..."
          maxLength={1000}
          required
          className="w-full rounded-lg border border-slate-600 bg-slate-900 p-3 text-sm text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="mt-1 text-right text-xs text-slate-400">
          {commentText.length}/1000 characters
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-300">
          Files
        </label>
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(e.target.files)}
          className="w-full text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
        />
        <p className="mt-2.5 max-w-full break-words text-xs leading-relaxed text-slate-400">
          Maximum 10 files; each file can be up to 10 MB. You can select files
          together or add them in multiple selections.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        {canCreateInternal ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-200">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
            />
            <span>Support staff only</span>
          </label>
        ) : (
          <div />
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={loading || !commentText.trim()}
        >
          {loading ? "Adding..." : "Add comment"}
        </Button>
      </div>
    </form>
  );
}