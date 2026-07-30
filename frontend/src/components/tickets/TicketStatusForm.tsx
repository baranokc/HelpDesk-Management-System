"use client";

import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { lookupService } from "@/src/services/lookupService";
import { LookupItemDto } from "@/src/types/common";
import { TicketStatusUpdateDto } from "@/src/types/ticket-status";
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

  useEffect(() => {
    lookupService.getStatuses().then(setStatuses);
  }, []);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({ ticketId, statusId, reason: reason || null });
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Select
        label="New status"
        onChange={(event) => setStatusId(event.target.value)}
        options={statuses.map((status) => ({
          value: status.itemId,
          label: status.name,
        }))}
        required
        value={statusId}
      />
      <Textarea
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
