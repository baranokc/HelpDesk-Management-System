"use client";

import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { lookupService } from "@/src/services/lookupService";
import { LookupItemDto } from "@/src/types/common";
import { TicketResolveDto } from "@/src/types/ticket-status";
import { ticketResolveSchema } from "@/src/schemas/statusSchemas";
import {
  FormErrors,
  getFormErrors,
} from "@/src/lib/validation";
import { Button } from "@/src/components/ui/Button";
import { Select } from "@/src/components/ui/Select";
import { Textarea } from "@/src/components/ui/Textarea";

interface TicketResolveFormProps {
  loading?: boolean;
  onSubmit: (dto: TicketResolveDto) => Promise<void>;
}

export function TicketResolveForm({
  loading = false,
  onSubmit,
}: TicketResolveFormProps) {
  const [categories, setCategories] = useState<LookupItemDto[]>([]);
  const [resolution, setResolution] = useState("");
  const [resolutionCategoryId, setResolutionCategoryId] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [validationErrors, setValidationErrors] = useState<FormErrors>({});

  useEffect(() => {
    lookupService.getResolutionCategories().then(setCategories);
  }, []);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = ticketResolveSchema.safeParse({
      resolution,
      resolutionCategoryId,
      internalNote,
    });

    if (!result.success) {
      setValidationErrors(getFormErrors(result.error));
      return;
    }

    setValidationErrors({});
    await onSubmit(result.data);
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Textarea
        error={validationErrors.resolution}
        hint={`${resolution.length}/250 characters`}
        label="Resolution"
        maxLength={250}
        minLength={10}
        onChange={(event) => setResolution(event.target.value)}
        required
        value={resolution}
      />
      <Select
        error={validationErrors.resolutionCategoryId}
        label="Resolution category"
        onChange={(event) => setResolutionCategoryId(event.target.value)}
        options={categories.map((category) => ({
          value: category.itemId,
          label: category.name,
        }))}
        value={resolutionCategoryId}
      />
      <Textarea
        error={validationErrors.internalNote}
        hint={`${internalNote.length}/250 characters`}
        label="Internal note"
        maxLength={250}
        onChange={(event) => setInternalNote(event.target.value)}
        value={internalNote}
      />
      <div className="flex justify-end">
        <Button loading={loading} type="submit">
          Resolve ticket
        </Button>
      </div>
    </form>
  );
}
