'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { TicketForm } from '@/src/components/tickets/TicketForm';
import { getApiErrorMessage } from '@/src/lib/api';
import { ticketService } from '@/src/services/ticketService';
import type { TicketCreateDto, TicketUpdateDto } from '@/src/types/ticket';

export default function CreateTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleSubmit = async (dto: TicketCreateDto | TicketUpdateDto) => {
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
      setError(
        getApiErrorMessage(
          requestError,
          'Ticket could not be created. Please check the entered values and try again.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400">
              <PlusCircle className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Create New Ticket
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Submit a detailed support request and our team will assist you shortly.
          </p>
        </div>

        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold
                     text-slate-700 dark:text-slate-300
                     bg-white/80 dark:bg-slate-900/80
                     border border-slate-200 dark:border-slate-800
                     hover:bg-slate-100 dark:hover:bg-slate-800
                     hover:text-indigo-600 dark:hover:text-indigo-400
                     hover:border-indigo-500/30 dark:hover:border-indigo-500/30
                     transition-all shadow-sm active:scale-95 shrink-0 self-start sm:self-auto"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Tickets</span>
        </Link>
      </div>

      {/* FORM CARD */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-indigo-500/5">
        <TicketForm
          error={error}
          loading={loading}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}