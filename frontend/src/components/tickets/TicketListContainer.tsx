"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  SearchX,
} from "lucide-react";
import { Alert } from "@/src/components/ui/Alert";
import { Avatar } from "@/src/components/ui/Avatar";
import { Pagination } from "@/src/components/ui/Pagination";
import { useAuth } from "@/src/context/AuthContext";
import { getApiErrorMessage } from "@/src/lib/api";
import { getTicketViewLabel } from "@/src/lib/ticketPermissions";
import { ticketService } from "@/src/services/ticketService";
import type {
  TicketFilterDto,
  TicketListDto,
  TicketPagedResultDto,
  TicketSortDirection,
  TicketSortField,
} from "@/src/types/ticket";
import { TicketFilters } from "./TicketFilterTabs";
import { TicketPriorityBadge } from "./TicketPriorityBadge";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketStatsCards } from "./TicketStatsCards";

const initialFilter: TicketFilterDto = {
  pageNumber: 1,
  pageSize: 25,
  sortBy: "ticketNumber",
  sortDirection: "desc",
};

const defaultSortDirections: Record<TicketSortField, TicketSortDirection> = {
  ticketNumber: "desc",
  title: "asc",
  status: "asc",
  priority: "desc",
  createdBy: "asc",
};

interface SortableHeaderProps {
  label: string;
  field: TicketSortField;
  activeField?: TicketSortField;
  direction?: TicketSortDirection;
  onSort: (field: TicketSortField) => void;
}

function SortableHeader({
  label,
  field,
  activeField,
  direction,
  onSort,
}: SortableHeaderProps) {
  const isActive = activeField === field;
  const Icon = !isActive
    ? ArrowUpDown
    : direction === "desc"
      ? ArrowDown
      : ArrowUp;

  return (
    <th scope="col" className="px-5 py-3.5">
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`group/sort inline-flex items-center gap-1.5 rounded-md text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/50 ${
          isActive
            ? "text-emerald-700 dark:text-purple-300"
            : "hover:text-stone-800 dark:hover:text-purple-200"
        }`}
        aria-label={`Sort by ${label}${
          isActive ? `, currently ${direction === "desc" ? "descending" : "ascending"}` : ""
        }`}
      >
        <span>{label}</span>
        <Icon
          aria-hidden="true"
          className={`h-3.5 w-3.5 ${
            isActive
              ? "opacity-100"
              : "opacity-45 transition-opacity group-hover/sort:opacity-100"
          }`}
        />
      </button>
    </th>
  );
}

function createEmptyResult(filter: TicketFilterDto): TicketPagedResultDto {
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

// 🚀 SCROLL ANIMASYONLU SATIR BİLEŞENİ
function TicketRow({ ticket, index }: { ticket: TicketListDto; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const rowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    const element = rowRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <tr
      ref={rowRef}
      className={`group transition-all duration-300 ease-out hover:bg-stone-100/70 dark:hover:bg-purple-950/20 ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-4 scale-[0.99]"
      }`}
      style={{ transitionDelay: `${(index % 8) * 35}ms` }}
    >
      <td className="px-5 py-4 font-mono font-bold text-emerald-700 dark:text-purple-400">
        {ticket.ticketNumber}
      </td>
      <td className="px-5 py-4 font-semibold text-stone-900 dark:text-slate-100 max-w-[240px] truncate">
        {ticket.ticketTitle}
      </td>
      <td className="px-5 py-4 text-stone-600 dark:text-slate-300">
        <span className="font-medium">{ticket.categoryName}</span>
        {ticket.subcategoryName && (
          <span className="block text-[11px] text-stone-400 dark:text-slate-500">
            {ticket.subcategoryName}
          </span>
        )}
      </td>
      <td className="px-5 py-4">
        <TicketStatusBadge status={ticket.statusName} />
      </td>
      <td className="px-5 py-4">
        <TicketPriorityBadge
          priority={ticket.priorityName}
          urgency={ticket.urgencyLevelName}
        />
      </td>
      <td className="px-5 py-4 text-stone-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <Avatar
            avatarUrl={ticket.createdByAvatarUrl}
            name={ticket.createdByName}
            size="xs"
            className="border border-emerald-600/30 dark:border-purple-800/40 shadow-sm"
          />
          <span className="font-medium truncate max-w-[130px]">
            {ticket.createdByName}
          </span>
        </div>
      </td>
      <td className="px-5 py-4 text-right">
        <Link
          className="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-purple-400 hover:text-emerald-800 dark:hover:text-purple-300 transition-all group-hover:translate-x-1"
          href={`/tickets/${ticket.id}`}
        >
          <span>View Details</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </td>
    </tr>
  );
}

export function TicketListContainer() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<TicketFilterDto>(initialFilter);
  const [result, setResult] = useState<TicketPagedResultDto>(() =>
    createEmptyResult(initialFilter)
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
              "Failed to load tickets. Please try again."
            )
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

  const changeSort = (sortBy: TicketSortField) => {
    setFilter((current) => {
      const sortDirection =
        current.sortBy === sortBy
          ? current.sortDirection === "asc"
            ? "desc"
            : "asc"
          : defaultSortDirections[sortBy];

      return {
        ...current,
        sortBy,
        sortDirection,
        pageNumber: 1,
      };
    });
  };

  const hasActiveFilters = Boolean(
    filter.search ||
      filter.statusId ||
      filter.categoryId ||
      filter.priorityId ||
      filter.assignedToId ||
      filter.createdById ||
      filter.urgencyLevelId ||
      filter.impactLevelId ||
      filter.createdFrom ||
      filter.createdTo
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-800 via-emerald-800 to-teal-900 dark:from-purple-300 dark:via-violet-200 dark:to-indigo-200 bg-clip-text text-transparent">
            {viewLabel.title}
          </h1>
          <p className="text-xs font-medium text-stone-500 dark:text-slate-400 mt-1">
            {viewLabel.description}
          </p>
        </div>
      </div>

      {/* KPI Kartları */}
      <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
        style={{ animationDelay: "100ms" }}
      >
        <TicketStatsCards
          loading={loading}
          openCount={result.openCount}
          inProgressCount={result.inProgressCount}
          completedCount={result.completedCount}
          totalCount={result.totalCount}
        />
      </div>

      {/* Filtre Barı */}
      <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
        style={{ animationDelay: "150ms" }}
      >
        <TicketFilters onApply={applyFilters} value={filter} />
      </div>

      {/* YÜKLENİYOR SKELETON */}
      {loading && (
        <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left border-collapse">
              <thead className="bg-stone-100/80 dark:bg-slate-800/50 border-b border-stone-200/80 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-purple-300/60">
                <tr>
                  <th className="px-5 py-3.5">Ticket #</th>
                  <th className="px-5 py-3.5">Title</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Created By</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60">
                {[1, 2, 3, 4, 5].map((item) => (
                  <tr key={item}>
                    <td className="px-5 py-4">
                      <div className="h-4 w-16 bg-stone-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-40 bg-stone-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-28 bg-stone-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-6 w-24 rounded-full bg-stone-200 dark:bg-slate-800 animate-pulse" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-6 w-24 rounded-full bg-stone-200 dark:bg-slate-800 animate-pulse" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-28 bg-stone-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="ml-auto h-4 w-20 bg-stone-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      {/* TABLO & İÇERİK */}
      {!loading && !error && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl overflow-hidden">
            {result.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 dark:bg-purple-500/15 border border-emerald-600/20 dark:border-purple-500/30 text-emerald-700 dark:text-purple-300 shadow-inner">
                  <SearchX className="h-7 w-7" />
                </div>
                <h3 className="mb-1 text-base font-bold text-stone-900 dark:text-white">
                  No tickets found
                </h3>
                <p className="max-w-sm text-xs text-stone-500 dark:text-slate-400 font-medium">
                  {hasActiveFilters
                    ? "No tickets match the selected filters. Try clearing or changing them."
                    : "There are no tickets available in your current view."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left border-collapse">
                  <thead className="bg-stone-100/80 dark:bg-slate-800/50 border-b border-stone-200/80 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-purple-300/60">
                    <tr>
                      <SortableHeader
                        label="Ticket #"
                        field="ticketNumber"
                        activeField={filter.sortBy}
                        direction={filter.sortDirection}
                        onSort={changeSort}
                      />
                      <SortableHeader
                        label="Title"
                        field="title"
                        activeField={filter.sortBy}
                        direction={filter.sortDirection}
                        onSort={changeSort}
                      />
                      <th className="px-5 py-3.5">Category</th>
                      <SortableHeader
                        label="Status"
                        field="status"
                        activeField={filter.sortBy}
                        direction={filter.sortDirection}
                        onSort={changeSort}
                      />
                      <SortableHeader
                        label="Priority"
                        field="priority"
                        activeField={filter.sortBy}
                        direction={filter.sortDirection}
                        onSort={changeSort}
                      />
                      <SortableHeader
                        label="Created By"
                        field="createdBy"
                        activeField={filter.sortBy}
                        direction={filter.sortDirection}
                        onSort={changeSort}
                      />
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60 text-xs font-medium">
                    {result.items.map((ticket, index) => (
                      <TicketRow
                        key={ticket.id}
                        ticket={ticket}
                        index={index}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {result.items.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row pt-2 px-1">
              <p className="text-xs text-stone-500 dark:text-slate-400 font-medium">
                Showing{" "}
                <span className="font-bold text-emerald-800 dark:text-purple-300">
                  {result.items.length}
                </span>{" "}
                of{" "}
                <span className="font-bold text-emerald-800 dark:text-purple-300">
                  {result.totalCount}
                </span>{" "}
                ticket(s)
              </p>
              <Pagination
                onChange={changePage}
                page={result.pageNumber}
                totalPages={result.totalPages}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}