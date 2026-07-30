"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { TicketCommentCreateDto } from "@/src/types/ticket-comment";
import { Button } from "@/src/components/ui/Button";
import { Checkbox } from "@/src/components/ui/Checkbox";
import { FileInput } from "@/src/components/ui/FileInput";
import { Textarea } from "@/src/components/ui/Textarea";

interface CommentFormProps {
  canCreateInternal?: boolean;
  loading?: boolean;
  onSubmit: (dto: TicketCommentCreateDto) => Promise<void>;
}

export function CommentForm({
  canCreateInternal = false,
  loading = false,
  onSubmit,
}: CommentFormProps) {
  const [comment, setComment] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isInternal, setIsInternal] = useState(false);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({ comment, attachments, isInternal });
    setComment("");
    setAttachments([]);
    setIsInternal(false);
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Textarea
        hint={`${comment.length}/1000 karakter`}
        label="New Comment"
        maxLength={1000}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Yanıtınızı yazın..."
        required
        value={comment}
      />
      <FileInput
        files={attachments}
        maxFileSizeMb={100}
        onChange={setAttachments}
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        {canCreateInternal ? (
          <Checkbox
            checked={isInternal}
            label="Support staff only"
            onChange={(event) => setIsInternal(event.target.checked)}
          />
        ) : (
          <span />
        )}
        <Button loading={loading} type="submit">
          Add comment
        </Button>
      </div>
    </form>
  );
}
