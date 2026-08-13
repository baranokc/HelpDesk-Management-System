"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit3, AlertTriangle } from "lucide-react";
import { Alert } from "@/src/components/ui/Alert";
import { Button } from "@/src/components/ui/Button";
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

  // 🌟 BİLET BULUNAMADI VEYA YÜKLENEMEDİ HATA EKRANI (LIGHT & DARK MOD UYUMLU)
  if (loadError || !ticket) {
    return (
      <div className="mx-auto max-w-md pt-16">
        <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 shadow-2xl text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 dark:border-rose-500/30 shadow-inner">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-black tracking-tight text-stone-900 dark:text-white">
              Unable to edit ticket
            </h2>
            <p className="text-xs font-medium text-stone-500 dark:text-slate-400">
              {loadError ?? "The requested ticket could not be found or you do not have permission to edit it."}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button onClick={() => void loadTicket()} variant="danger" className="w-full sm:w-auto !rounded-xl !text-xs !font-bold">
              Try again
            </Button>

            <Link
              href="/tickets"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-stone-700 dark:text-slate-200 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-300/80 dark:border-slate-700 transition-all shadow-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to tickets</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 🌟 YETKİSİZ ERİŞİM HATA EKRANI (LIGHT & DARK MOD UYUMLU)
  if (!canManageTicket(user, ticket)) {
    return (
      <div className="mx-auto max-w-md pt-16">
        <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 shadow-2xl text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30 shadow-inner">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-black tracking-tight text-stone-900 dark:text-white">
              Access Denied
            </h2>
            <p className="text-xs font-medium text-stone-500 dark:text-slate-400">
              You do not have permission to edit this ticket.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <Link
              href="/tickets"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-stone-700 dark:text-slate-200 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-300/80 dark:border-slate-700 transition-all shadow-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to tickets</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both relative">
      {/* Arka Plan Aura Efektleri */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-amber-500/10 dark:bg-purple-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-teal-500/10 dark:bg-indigo-600/15 blur-3xl pointer-events-none" />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-stone-200/80 dark:border-purple-900/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-400 shadow-sm">
              <Edit3 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
              Edit Ticket #{ticket.ticketNumber}
            </h1>
          </div>
          <p className="text-xs font-medium text-stone-500 dark:text-slate-400">
            Update ticket properties, category assignment or explanation details below.
          </p>
        </div>

        <Link
          href={`/tickets/${ticketId}`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold
                     text-stone-700 dark:text-slate-300
                     bg-white/80 dark:bg-slate-900/80
                     border border-stone-300/80 dark:border-purple-800/40
                     hover:bg-stone-100 dark:hover:bg-slate-800
                     hover:text-rose-600 dark:hover:text-rose-400
                     transition-all shadow-sm active:scale-95 shrink-0 self-start sm:self-auto"
        >
          <span>Cancel</span>
        </Link>
      </div>

      {saveError && <Alert variant="error">{saveError}</Alert>}

      {/* FORM CARD */}
      <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-6 sm:p-8 shadow-xl">
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