"use client";

import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { CheckCircle2, Tag, Lock, ArrowRight } from "lucide-react";
import { lookupService } from "@/src/services/lookupService";
import { LookupItemDto } from "@/src/types/common";
import { TicketResolveDto } from "@/src/types/ticket-status";
import { ticketResolveSchema } from "@/src/schemas/statusSchemas";
import { FormErrors, getFormErrors } from "@/src/lib/validation";
import { Button } from "@/src/components/ui/Button";

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
      {/* RESOLUTION AÇIKLAMASI */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Resolution Summary</span>
            <span className="text-rose-500">*</span>
          </label>
          <span className="text-[10px] text-slate-400 font-mono">{resolution.length}/250</span>
        </div>
        <textarea
          required
          rows={3}
          maxLength={250}
          minLength={10}
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          placeholder="Provide a detailed explanation of how the issue was resolved..."
          className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
        />
        {validationErrors.resolution && (
          <p className="text-[11px] font-medium text-rose-500">{validationErrors.resolution}</p>
        )}
      </div>

      {/* KATEGORİ */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Tag className="h-3.5 w-3.5 text-emerald-500" />
          <span>Resolution Category</span>
        </label>
        <select
          value={resolutionCategoryId}
          onChange={(e) => setResolutionCategoryId(e.target.value)}
          className="w-full appearance-none rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-3.5 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
        >
          <option value="">Select resolution category...</option>
          {categories.map((category) => (
            <option key={category.itemId} value={category.itemId}>
              {category.name}
            </option>
          ))}
        </select>
        {validationErrors.resolutionCategoryId && (
          <p className="text-[11px] font-medium text-rose-500">{validationErrors.resolutionCategoryId}</p>
        )}
      </div>

      {/* İÇ NOT */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Lock className="h-3.5 w-3.5 text-amber-500" />
            <span>Internal Note (Team only)</span>
          </label>
          <span className="text-[10px] text-slate-400 font-mono">{internalNote.length}/250</span>
        </div>
        <textarea
          rows={2}
          maxLength={250}
          value={internalNote}
          onChange={(e) => setInternalNote(e.target.value)}
          placeholder="Private notes for team members... (optional)"
          className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
        />
        {validationErrors.internalNote && (
          <p className="text-[11px] font-medium text-rose-500">{validationErrors.internalNote}</p>
        )}
      </div>

      {/* SUBMIT */}
      <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <Button
          loading={loading}
          type="submit"
          className="!inline-flex !items-center !gap-2 !px-5 !py-2.5 !rounded-xl !text-xs !font-bold !text-white !bg-gradient-to-r !from-emerald-600 !to-teal-600 hover:!from-emerald-500 hover:!to-teal-500 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all"
        >
          <span>Resolve Ticket</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </form>
  );
}