'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TicketForm } from '@/src/components/tickets/TicketForm';
import { getApiErrorMessage } from '@/src/lib/api';
import { ticketService } from '@/src/services/ticketService';
import type {
  TicketCreateDto,
  TicketUpdateDto,
} from '@/src/types/ticket';

export default function CreateTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleSubmit = async (
    dto: TicketCreateDto | TicketUpdateDto,
  ) => {
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Create New Ticket
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Submit a new support request to our team
          </p>
        </div>

        <Link
          className="link link-primary shrink-0 text-sm font-medium no-underline hover:underline"
          href="/tickets"
        >
          &larr; Back to Tickets
        </Link>
      </div>

      <div className="card border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg transition-colors">
        <div className="card-body">
          <TicketForm
            error={error}
            loading={loading}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}