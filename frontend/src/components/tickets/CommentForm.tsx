"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { TicketCommentCreateDto } from "@/src/types/ticket-comment";
import { ticketCommentCreateSchema } from "@/src/schemas/commentSchemas";
import {
  FormErrors,
  getFormErrors,
} from "@/src/lib/validation";
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
  const [validationErrors, setValidationErrors] = useState<FormErrors>({});

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = ticketCommentCreateSchema.safeParse({
      comment,
      attachments,
      isInternal,
    });

    if (!result.success) {
      setValidationErrors(getFormErrors(result.error));
      return;
    }

    setValidationErrors({});
    await onSubmit(result.data);

    setComment("");
    setAttachments([]);
    setIsInternal(false);
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Textarea
        error={validationErrors.comment}
        hint={`${comment.length}/1000 characters`}
        label="New Comment"
        maxLength={1000}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Write your response..."
        required
        value={comment}
      />
      <FileInput
        accept=".jpg,.jpeg,.png,.pdf,.txt,.docx,.xlsx,.zip,.rar,.7z"
        error={validationErrors.attachments}
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
