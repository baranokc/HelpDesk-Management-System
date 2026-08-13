'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { TicketForm } from '@/src/components/tickets/TicketForm';
import { getApiErrorMessage } from '@/src/lib/api';
import { ticketService } from '@/src/services/ticketService';
import type { TicketCreateDto, TicketUpdateDto } from '@/src/types/ticket';

export default function CreateTicketPage() {
  const router = useRouter();
  const submitLockRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleSubmit = async (dto: TicketCreateDto | TicketUpdateDto) => {
    if (submitLockRef.current) {
      return;
    }

    submitLockRef.current = true;
    setError(undefined);
    setLoading(true);

    try {
      if (!("attachments" in dto)) {
        throw new Error("Invalid ticket creation data.");
      }

      await ticketService.create(dto);
      router.push('/tickets');
      router.refresh();
    } catch (requestError: unknown) {
      submitLockRef.current = false;
      setLoading(false);

      setError(
        getApiErrorMessage(
          requestError,
          'Ticket could not be created. Please check the entered values and try again.',
        ),
      );
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both relative">
      {/* Arka Plan Aura / Glow Efektleri */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-emerald-500/10 dark:bg-purple-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-teal-500/10 dark:bg-indigo-600/15 blur-3xl pointer-events-none" />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-purple-900/30">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 via-teal-600 to-emerald-600 dark:from-purple-600 dark:via-violet-600 dark:to-indigo-500 text-white shadow-lg shadow-teal-600/20 dark:shadow-purple-500/25">
              <PlusCircle className="h-5 w-5 drop-shadow-md" />
            </div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-800 via-emerald-800 to-teal-900 dark:from-purple-300 dark:via-violet-200 dark:to-indigo-200 bg-clip-text text-transparent">
              Create New Ticket
            </h1>
          </div>
          <p className="text-xs font-medium text-stone-500 dark:text-slate-400">
            Submit a detailed support request and our Island team will assist you shortly.
          </p>
        </div>

        {/* BACK BUTTON */}
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold
                     text-stone-700 dark:text-slate-300
                     bg-white/80 dark:bg-slate-900/80
                     border border-stone-300/80 dark:border-purple-800/40
                     hover:bg-stone-100 dark:hover:bg-slate-800/80
                     hover:text-emerald-800 dark:hover:text-purple-300
                     hover:border-emerald-600/40 dark:hover:border-purple-500/50
                     transition-all shadow-sm active:scale-95 shrink-0 self-start sm:self-auto"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Tickets</span>
        </Link>
      </div>

      {/* FORM CARD */}
      <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl transition-all">
        <TicketForm
          error={error}
          loading={loading}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}