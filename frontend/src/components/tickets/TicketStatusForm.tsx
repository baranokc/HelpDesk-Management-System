"use client";

import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { lookupService } from "@/src/services/lookupService";
import { LookupItemDto } from "@/src/types/common";
import { TicketStatusUpdateDto } from "@/src/types/ticket-status";
import { ticketStatusUpdateSchema } from "@/src/schemas/statusSchemas";
import {
  FormErrors,
  getFormErrors,
} from "@/src/lib/validation";
import { Button } from "@/src/components/ui/Button";
import { Select } from "@/src/components/ui/Select";
import { Textarea } from "@/src/components/ui/Textarea";

interface TicketStatusFormProps {
  ticketId: string;
  currentStatusId?: string;
  loading?: boolean;
  onSubmit: (dto: TicketStatusUpdateDto) => Promise<void>;
}

export function TicketStatusForm({
  ticketId,
  currentStatusId = "",
  loading = false,
  onSubmit,
}: TicketStatusFormProps) {
  const [statuses, setStatuses] = useState<LookupItemDto[]>([]);
  const [statusId, setStatusId] = useState(currentStatusId);
  const [reason, setReason] = useState("");
  const [validationErrors, setValidationErrors] = useState<FormErrors>({});

  useEffect(() => {
    lookupService.getStatuses().then(setStatuses);
  }, []);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = ticketStatusUpdateSchema.safeParse({
      ticketId,
      statusId,
      reason,
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
      {validationErrors.ticketId && (
        <p className="text-sm text-error">{validationErrors.ticketId}</p>
      )}
      <Select
        error={validationErrors.statusId}
        label="New status"
        onChange={(event) => setStatusId(event.target.value)}
        options={statuses.map((status) => ({
          value: status.itemId,
          label: status.name,
        })).filter(
          (status) =>
            status.label.toLowerCase() !== "resolved" &&
            status.label.toLowerCase() !== "closed",
        )}
        required
        value={statusId}
      />
      <Textarea
        error={validationErrors.reason}
        hint={`${reason.length}/250 characters`}
        label="Change reason"
        maxLength={250}
        onChange={(event) => setReason(event.target.value)}
        value={reason}
      />
      <div className="flex justify-end">
        <Button loading={loading} type="submit">
          Update status
        </Button>
      </div>
    </form>
  );
}
