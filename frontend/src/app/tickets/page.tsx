'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ticketService } from '@/src/services/ticketService';
import { TicketListDto } from '@/src/types/ticket';

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
      const data = await ticketService.getAll();
      setTickets(data);
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

  const getStatusBadge = (statusName: string) => {
    const status = statusName?.toLowerCase() || '';
    if (status.includes('open') || status.includes('açık')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (status.includes('progress') || status.includes('devam')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (status.includes('resolved') || status.includes('çözüldü')) {
      return 'bg-green-50 text-green-700 border-green-200';
    }
    if (status.includes('closed') || status.includes('kapatıldı')) {
      return 'bg-slate-100 text-slate-600 border-slate-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const getPriorityBadge = (priortyName: string) => {
    const priority = priortyName?.toLowerCase() || '';
    if (priority.includes('critical') || priority.includes('kritik')) {
      return 'bg-red-100 text-red-800';
    }
    if (priority.includes('high') || priority.includes('yüksek')) {
      return 'bg-orange-100 text-orange-800';
    }
    if (priority.includes('medium') || priority.includes('orta')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Yeni Bilet Butonu */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
          <p className="text-sm text-slate-500">Manage and track all helpdesk requests</p>
        </div>
        <Link
          href="/tickets/new"
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          + Create New Ticket
        </Link>
      </div>

      {/* Arama ve Filtreleme Barı */}
      <div className="flex flex-col sm:flex-row gap-4 rounded-lg bg-white p-4 shadow-sm border border-slate-200">
        <input
          type="text"
          placeholder="Search by title, ticket # or creator..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Yükleniyor / Hata Durumları */}
      {loading && (
        <div className="text-center py-12 text-slate-500 text-sm">
          Loading tickets...
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200 text-center">
          {error}
        </div>
      )}

      {/* Bilet Listesi Tablosu */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm border border-slate-200">
          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No tickets found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-6 py-3">Ticket #</th>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Priority</th>
                    <th className="px-6 py-3">Created By</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500 font-semibold">
                        {ticket.ticketNumber}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {ticket.ticketTitle}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {ticket.categoryName}
                        {ticket.subcategoryName && (
                          <span className="text-xs text-slate-400 block">
                            {ticket.subcategoryName}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(ticket.statusName)}`}>
                          {ticket.statusName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${getPriorityBadge(ticket.priortyName)}`}>
                          {ticket.priortyName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {ticket.createdByName}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="font-medium text-indigo-600 hover:text-indigo-500"
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