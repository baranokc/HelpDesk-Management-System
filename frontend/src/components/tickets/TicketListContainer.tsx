'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ticketService } from '@/src/services/ticketService';
import type { TicketListDto } from '@/src/types/ticket';
import { TicketStatusBadge } from './TicketStatusBadge';
import { TicketPriorityBadge } from './TicketPriorityBadge';

export function TicketListContainer() {
  const [tickets, setTickets] = useState<TicketListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await ticketService.getAll({
          pageNumber: 1,
          pageSize: 25,
        });

        setTickets(result.items ?? []);
      } catch {
        setTickets([]);
        setError('Failed to load tickets. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    void fetchTickets();
  }, []);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.ticketTitle.toLowerCase().includes(normalizedSearch) ||
      ticket.ticketNumber.toLowerCase().includes(normalizedSearch) ||
      ticket.createdByName.toLowerCase().includes(normalizedSearch);

    const matchesStatus =
      statusFilter === 'ALL' ||
      ticket.statusName.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Support Tickets
          </h1>

          <p className="text-sm text-slate-600">
            Manage and track all helpdesk requests
          </p>
        </div>

        <Link
          href="/tickets/new"
          className="btn btn-outline btn-primary"
        >
          + Create New Ticket
        </Link>
      </div>

      <div className="card border border-slate-200 bg-white shadow-sm">
        <div className="card-body flex-col gap-4 p-4 sm:flex-row">
          <input
            type="text"
            placeholder="Search by title, ticket # or creator..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="input input-bordered w-full flex-1 bg-white text-sm text-slate-900 focus:input-primary"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="select select-bordered w-full bg-white text-sm text-slate-900 focus:select-primary sm:w-48"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="card overflow-hidden border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-700">
                <tr>
                  <th>Ticket #</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Created By</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[1, 2, 3, 4, 5].map((item) => (
                  <tr key={item}>
                    <td>
                      <div className="skeleton h-4 w-16 bg-slate-200"></div>
                    </td>
                    <td>
                      <div className="skeleton h-4 w-40 bg-slate-200"></div>
                    </td>
                    <td>
                      <div className="skeleton h-4 w-28 bg-slate-200"></div>
                    </td>
                    <td>
                      <div className="skeleton h-6 w-20 rounded-full bg-slate-200"></div>
                    </td>
                    <td>
                      <div className="skeleton h-6 w-16 rounded-full bg-slate-200"></div>
                    </td>
                    <td>
                      <div className="skeleton h-4 w-24 bg-slate-200"></div>
                    </td>
                    <td className="text-right">
                      <div className="skeleton h-4 w-20 ml-auto bg-slate-200"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error text-sm text-white shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="card overflow-hidden border border-slate-200 bg-white shadow-sm">
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
              </div>

              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                No tickets found
              </h3>
              
              <p className="text-slate-500 text-sm max-w-sm">
                {search || statusFilter !== 'ALL'
                  ? 'No support tickets match your search filters. Try clearing or changing your filters.'
                  : 'You have not created any support tickets yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-700">
                  <tr>
                    <th>Ticket #</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created By</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="font-mono text-xs font-semibold text-slate-500">
                        {ticket.ticketNumber}
                      </td>

                      <td className="font-medium text-slate-900">
                        {ticket.ticketTitle}
                      </td>

                      <td className="text-slate-600">
                        {ticket.categoryName}

                        {ticket.subcategoryName && (
                          <span className="block text-xs text-slate-400">
                            {ticket.subcategoryName}
                          </span>
                        )}
                      </td>

                      <td>
                        <TicketStatusBadge
                          status={ticket.statusName}
                        />
                      </td>

                      <td>
                        <TicketPriorityBadge
                          priority={ticket.priorityName}
                        />
                      </td>

                      <td className="text-slate-600">
                        {ticket.createdByName}
                      </td>

                      <td className="text-right">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="link link-primary font-medium no-underline hover:underline"
                        >
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}