"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { ticketAttachmentCreateSchema } from "@/src/schemas/attachmentSchemas";
import { getFormErrors } from "@/src/lib/validation";
import type { FormErrors } from "@/src/lib/validation";
import { Button } from "@/src/components/ui/Button";
import { FileInput } from "@/src/components/ui/FileInput";
import { Input } from "@/src/components/ui/Input";
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
      // The parent displays the API error. Keep the selected files for retrying.
      return;
    }

    setFiles([]);
    setDescription("");
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <FileInput
        accept=".jpg,.jpeg,.png,.pdf,.txt,.docx,.xlsx,.zip,.rar,.7z"
        error={validationErrors.files}
        files={files}
        maxFiles={10}
        maxFileSizeMb={10}
        multiple
        onChange={setFiles}
      />
      <Input
        error={validationErrors.description}
        label="File description"
        maxLength={100}
        onChange={(event) => setDescription(event.target.value)}
        value={description}
      />
      <div className="flex justify-end">
        <Button disabled={files.length === 0} loading={loading} type="submit">
          Upload files
        </Button>
      </div>
    </form>
  );
}
