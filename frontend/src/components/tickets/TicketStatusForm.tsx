"use client";

import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { RefreshCw, MessageSquare, ArrowRight } from "lucide-react";
import { lookupService } from "@/src/services/lookupService";
import { LookupItemDto } from "@/src/types/common";
import { TicketStatusUpdateDto } from "@/src/types/ticket-status";
import { ticketStatusUpdateSchema } from "@/src/schemas/statusSchemas";
import { FormErrors, getFormErrors } from "@/src/lib/validation";
import { Button } from "@/src/components/ui/Button";

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
        <p className="text-xs font-semibold text-rose-500">{validationErrors.ticketId}</p>
      )}

      {/* DURUM SEÇİMİ */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <RefreshCw className="h-3.5 w-3.5 text-sky-500" />
          <span>New Status</span>
          <span className="text-rose-500">*</span>
        </label>
        <select
          required
          value={statusId}
          onChange={(e) => setStatusId(e.target.value)}
          className="w-full appearance-none rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-3.5 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 shadow-inner focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
        >
          <option value="">Select new status...</option>
          {statuses
            .filter(
              (s) =>
                s.name.toLowerCase() !== "resolved" &&
                s.name.toLowerCase() !== "closed"
            )
            .map((status) => (
              <option key={status.itemId} value={status.itemId}>
                {status.name}
              </option>
            ))}
        </select>
        {validationErrors.statusId && (
          <p className="text-[11px] font-medium text-rose-500">{validationErrors.statusId}</p>
        )}
      </div>

      {/* NEDEN */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <MessageSquare className="h-3.5 w-3.5 text-sky-500" />
            <span>Change Reason</span>
          </label>
          <span className="text-[10px] text-slate-400 font-mono">{reason.length}/250</span>
        </div>
        <textarea
          rows={3}
          maxLength={250}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Add a note explaining this status update... (optional)"
          className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-inner focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all resize-none"
        />
        {validationErrors.reason && (
          <p className="text-[11px] font-medium text-rose-500">{validationErrors.reason}</p>
        )}
      </div>

      {/* SUBMIT */}
      <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <Button
          loading={loading}
          type="submit"
          className="!inline-flex !items-center !gap-2 !px-5 !py-2.5 !rounded-xl !text-xs !font-bold !text-white !bg-gradient-to-r !from-sky-600 !to-blue-600 hover:!from-sky-500 hover:!to-blue-500 shadow-md shadow-sky-500/20 active:scale-[0.98] transition-all"
        >
          <span>Update Status</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </form>
  );
}