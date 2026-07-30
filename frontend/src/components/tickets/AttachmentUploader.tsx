"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { Button } from "@/src/components/ui/Button";
import { FileInput } from "@/src/components/ui/FileInput";
import { Input } from "@/src/components/ui/Input";
import { TicketAttachmentCreateDto } from "@/src/types/ticket-attachment";

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

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onUpload({ files, description: description || null });
    setFiles([]);
    setDescription("");
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <FileInput
        accept=".jpg,.jpeg,.png,.pdf,.txt,.docx,.xlsx,.zip,.rar,.7z"
        files={files}
        maxFileSizeMb={100}
        onChange={setFiles}
      />
      <Input
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
