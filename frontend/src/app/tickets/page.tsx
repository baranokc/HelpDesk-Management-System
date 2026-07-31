'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ticketService } from '@/src/services/ticketService';
import { TicketListDto } from '@/src/types/ticket';
import { TicketStatusBadge } from "@/src/components/tickets/TicketStatusBadge";
import { TicketPriorityBadge } from "@/src/components/tickets/TicketPriorityBadge";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchTickets();
  }, []);

const fetchTickets = async () => {
  try {
    setLoading(true);
    setError(null);

    const result = await ticketService.getAll({
      pageNumber: 1,
      pageSize: 25,
    });

    setTickets(result.items);
  } catch (err: unknown) {
    setError('Failed to load tickets. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.ticketTitle.toLowerCase().includes(search.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      ticket.createdByName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      ticket.statusName.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Create Ticket Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
          <p className="text-sm text-slate-600">Manage and track all helpdesk requests</p>
        </div>
        <Link
          href="/tickets/new"
          className="btn btn-outline btn-primary"
        >
          + Create New Ticket
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <div className="card bg-white shadow-sm border border-slate-200">
        <div className="card-body p-4 flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by title, ticket # or creator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered w-full flex-1 bg-white text-slate-900 focus:input-primary text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select select-bordered w-full sm:w-48 bg-white text-slate-900 focus:select-primary text-sm"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <span className="text-sm">Loading tickets...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="alert alert-error text-white text-sm shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
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

      {/* Ticket List Table */}
      {!loading && !error && (
        <div className="card bg-white shadow-sm border border-slate-200 overflow-hidden">
          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No tickets found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                {/* Table Header */}
                <thead className="bg-slate-50 text-slate-700 font-semibold text-xs uppercase">
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
                {/* Table Body */}
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