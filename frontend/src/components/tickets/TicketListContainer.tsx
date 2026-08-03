"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert } from "@/src/components/ui/Alert";
import { Pagination } from "@/src/components/ui/Pagination";
import { useAuth } from "@/src/context/AuthContext";
import { getApiErrorMessage } from "@/src/lib/api";
import { getTicketViewLabel } from "@/src/lib/ticketPermissions";
import { ticketService } from "@/src/services/ticketService";
import type {
  TicketFilterDto,
  TicketPagedResultDto,
} from "@/src/types/ticket";
import { TicketFilters } from "./TicketFilterTabs";
import { TicketPriorityBadge } from "./TicketPriorityBadge";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketStatsCards } from "./TicketStatsCards"; // <--- BİLEŞEN IMPORT EDİLDİ

const initialFilter: TicketFilterDto = {
  pageNumber: 1,
  pageSize: 25,
};

function createEmptyResult(
  filter: TicketFilterDto,
): TicketPagedResultDto {
  return {
    items: [],
    pageNumber: filter.pageNumber ?? 1,
    pageSize: filter.pageSize ?? 25,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
    openCount: 0,
    inProgressCount: 0,
    completedCount: 0,
  };
}

export function TicketListContainer() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<TicketFilterDto>(initialFilter);
  const [result, setResult] = useState<TicketPagedResultDto>(() =>
    createEmptyResult(initialFilter),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const viewLabel = getTicketViewLabel(user?.role);

  useEffect(() => {
    let cancelled = false;

    const fetchTickets = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await ticketService.getAll(filter);

        if (!cancelled) {
          setResult(response);
        }
      } catch (requestError: unknown) {
        if (!cancelled) {
          setResult(createEmptyResult(filter));
          setError(
            getApiErrorMessage(
              requestError,
              "Failed to load tickets. Please try again.",
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchTickets();

    return () => {
      cancelled = true;
    };
  }, [filter]);

  const applyFilters = (nextFilter: TicketFilterDto) => {
    setFilter({
      ...nextFilter,
      pageNumber: 1,
      pageSize: nextFilter.pageSize ?? 25,
    });
  };

  const changePage = (pageNumber: number) => {
    setFilter((current) => ({
      ...current,
      pageNumber,
    }));
  };
  const hasActiveFilters = Boolean(
    filter.search ||
      filter.statusId ||
      filter.categoryId ||
      filter.assignedToId ||
      filter.createdById ||
      filter.urgencyLevelId ||
      filter.impactLevelId ||
      filter.createdFrom ||
      filter.createdTo,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {viewLabel.title}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {viewLabel.description}
          </p>
        </div>
      </div>

      {/* KPI / İÇERİK KARTLARI */}
      <TicketStatsCards
        loading={loading}
        openCount={result.openCount}
        inProgressCount={result.inProgressCount}
        completedCount={result.completedCount}
        totalCount={result.totalCount}
      />

      {/* Filtre Kartı */}
      <div className="card border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors">
        <div className="card-body p-4">
          <TicketFilters onApply={applyFilters} value={filter} />
        </div>
      </div>

      {loading && (
        <div className="card overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
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
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[1, 2, 3, 4, 5].map((item) => (
                  <tr key={item}>
                    <td>
                      <div className="skeleton h-4 w-16 bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td>
                      <div className="skeleton h-4 w-40 bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td>
                      <div className="skeleton h-4 w-28 bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td>
                      <div className="skeleton h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td>
                      <div className="skeleton h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td>
                      <div className="skeleton h-4 w-24 bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="text-right">
                      <div className="skeleton ml-auto h-4 w-20 bg-slate-200 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && (
        <>
          <div className="card overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors">
            {result.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">
                  No tickets found
                </h3>
                <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
                  {hasActiveFilters
                    ? "No tickets match the selected filters. Try clearing or changing them."
                    : "There are no tickets available in your current view."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
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
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {result.items.map((ticket) => (
                      <tr
                        className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                        key={ticket.id}
                      >
                        <td className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {ticket.ticketNumber}
                        </td>
                        <td className="font-medium text-slate-900 dark:text-white">
                          {ticket.ticketTitle}
                        </td>
                        <td className="text-slate-600 dark:text-slate-300">
                          {ticket.categoryName}
                          {ticket.subcategoryName && (
                            <span className="block text-xs text-slate-400 dark:text-slate-500">
                              {ticket.subcategoryName}
                            </span>
                          )}
                        </td>
                        <td>
                          <TicketStatusBadge status={ticket.statusName} />
                        </td>
                        <td>
                          <TicketPriorityBadge priority={ticket.priorityName} />
                        </td>
                        <td className="text-slate-600 dark:text-slate-300">
                          {ticket.createdByName}
                        </td>
                        <td className="text-right">
                          <Link
                            className="link link-primary font-medium no-underline hover:underline"
                            href={`/tickets/${ticket.id}`}
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

          {result.items.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {result.totalCount} ticket(s) in this view
              </p>
              <Pagination
                onChange={changePage}
                page={result.pageNumber}
                totalPages={result.totalPages}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
