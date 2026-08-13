"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit3 } from "lucide-react";
import { Alert } from "@/src/components/ui/Alert";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { useAuth } from "@/src/context/AuthContext";
import { getApiErrorMessage } from "@/src/lib/api";
import { canManageTicket } from "@/src/lib/ticketPermissions";
import { ticketService } from "@/src/services/ticketService";
import type { TicketDetailDto, TicketUpdateDto } from "@/src/types/ticket";
import { TicketForm } from "./TicketForm";

interface TicketEditContainerProps {
  ticketId: string;
}

export function TicketEditContainer({ ticketId }: TicketEditContainerProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const submitLockRef = useRef(false);
  const [ticket, setTicket] = useState<TicketDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadTicket = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      setTicket(await ticketService.getById(ticketId));
    } catch (error: unknown) {
      setLoadError(
        getApiErrorMessage(
          error,
          "Ticket not found or you do not have permission to edit it.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    void loadTicket();
  }, [loadTicket]);

  const handleSubmit = async (dto: TicketUpdateDto) => {
    if (submitLockRef.current) {
      return;
    }

    submitLockRef.current = true;
    setSaving(true);
    setSaveError(null);

    try {
      const categoryChanged = dto.categoryId !== ticket?.categoryId;

      await ticketService.update(ticketId, dto);
      router.replace(categoryChanged ? "/tickets" : `/tickets/${ticketId}`);
      router.refresh();
    } catch (error: unknown) {
      submitLockRef.current = false;
      setSaving(false);

      setSaveError(
        getApiErrorMessage(
          error,
          "An error occurred while updating the ticket.",
        ),
      );
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner label="Loading ticket details..." />;
  }

  if (loadError || !ticket) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert variant="error">{loadError ?? "Ticket not found."}</Alert>
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tickets
        </Link>
      </div>
    );
  }

  if (!canManageTicket(user, ticket)) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert variant="error">
          You do not have permission to edit this ticket.
        </Alert>
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400">
              <Edit3 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Edit Ticket #{ticket.ticketNumber}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Update ticket properties, category assignment or explanation details below.
          </p>
        </div>

        <Link
          href={`/tickets/${ticketId}`}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold
                     text-slate-700 dark:text-slate-300
                     bg-white/80 dark:bg-slate-900/80
                     border border-slate-200 dark:border-slate-800
                     hover:bg-slate-100 dark:hover:bg-slate-800
                     hover:text-rose-600 dark:hover:text-rose-400
                     transition-all shadow-sm active:scale-95 shrink-0 self-start sm:self-auto"
        >
          <span>Cancel</span>
        </Link>
      </div>

      {/* FORM CARD */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-indigo-500/5">
        <TicketForm
          error={saveError ?? undefined}
          initialTicket={ticket}
          loading={saving}
          onSubmit={(dto) => handleSubmit(dto as TicketUpdateDto)}
        />
      </div>
    </div>
  );
}