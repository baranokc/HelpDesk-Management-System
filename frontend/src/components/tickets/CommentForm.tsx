"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/Button";
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
          className="textarea textarea-bordered w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus:textarea-primary placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
        />
        <div className="mt-1 text-right text-xs text-slate-400">
          {commentText.length}/1000 characters
        </div>
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
