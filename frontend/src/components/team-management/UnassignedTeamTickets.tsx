"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Clock3,
  Inbox,
  UserPlus,
} from "lucide-react";
import { Alert } from "@/src/components/ui/Alert";
import { Avatar } from "@/src/components/ui/Avatar";
import { Modal } from "@/src/components/ui/Modal";
import { Pagination } from "@/src/components/ui/Pagination";
import { Toast } from "@/src/components/ui/Toast";
import { TicketAssignmentForm } from "@/src/components/tickets/TicketAssignmentForm";
import { TicketPriorityBadge } from "@/src/components/tickets/TicketPriorityBadge";
import { TicketStatusBadge } from "@/src/components/tickets/TicketStatusBadge";
import { getApiErrorMessage } from "@/src/lib/api";
import { ticketAssignmentService } from "@/src/services/ticketAssignmentService";
import type { PagedResultDto } from "@/src/types/common";
import type { UnassignedTeamTicketDto } from "@/src/types/team-management";
import type { TicketSortDirection, TicketSortField } from "@/src/types/ticket";
import type { TicketAssignmentDto } from "@/src/types/ticket-assignment";

interface UnassignedTeamTicketsProps {
  teamId: string;
  teamName: string;
  tickets: PagedResultDto<UnassignedTeamTicketDto>;
  loading?: boolean;
  onAssigned: () => Promise<void>;
  onPageChange: (pageNumber: number) => void;
  onSort: (sortBy: TicketSortField) => void;
  sortBy: TicketSortField;
  sortDirection: TicketSortDirection;
}

interface SortableHeaderProps {
  label: string;
  field: TicketSortField;
  activeField: TicketSortField;
  direction: TicketSortDirection;
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
    <th className="px-5 py-3.5" scope="col">
      <button
        aria-label={`Sort by ${label}${
          isActive
            ? `, currently ${direction === "desc" ? "descending" : "ascending"}`
            : ""
        }`}
        className={`group/sort inline-flex items-center gap-1.5 rounded-md text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
          isActive
            ? "text-indigo-700 dark:text-violet-300"
            : "hover:text-slate-800 dark:hover:text-violet-200"
        }`}
        onClick={() => onSort(field)}
        type="button"
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function UnassignedTeamTickets({
  teamId,
  teamName,
  tickets,
  loading = false,
  onAssigned,
  onPageChange,
  onSort,
  sortBy,
  sortDirection,
}: UnassignedTeamTicketsProps) {
  const router = useRouter();
  const [selectedTicket, setSelectedTicket] =
    useState<UnassignedTeamTicketDto | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const openAssignment = (ticket: UnassignedTeamTicketDto) => {
    setAssignmentError(null);
    setSuccessMessage(null);
    setSelectedTicket(ticket);
  };

  const closeAssignment = () => {
    if (assigning) return;

    setAssignmentError(null);
    setSelectedTicket(null);
  };

  const handleAssign = async (dto: TicketAssignmentDto) => {
    if (!selectedTicket) return;

    setAssigning(true);
    setAssignmentError(null);

    try {
      const assignedTicketNumber = selectedTicket.ticketNumber;

      await ticketAssignmentService.assignTicket(selectedTicket.id, dto);
      setSelectedTicket(null);
      setSuccessMessage(`${assignedTicketNumber} was assigned successfully.`);
      await onAssigned();
    } catch (requestError: unknown) {
      setAssignmentError(
        getApiErrorMessage(
          requestError,
          "The ticket could not be assigned. Please check the selected team member.",
        ),
      );
    } finally {
      setAssigning(false);
    }
  };

  return (
    <section
      className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-500"
      style={{ animationDelay: "150ms" }}
    >
      {successMessage && (
        <Toast
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
          variant="success"
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Unassigned Team Tickets
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Tickets assigned to {teamName} that are waiting for a team member.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <Inbox className="h-3.5 w-3.5" />
          {tickets.totalCount} waiting ticket(s)
        </span>
      </div>

      <div
        className={`overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-md transition-opacity dark:border-slate-800 dark:bg-slate-900/80 ${
          loading ? "pointer-events-none opacity-60" : "opacity-100"
        }`}
      >
        {tickets.items.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Inbox className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Team queue is clear
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Every active ticket in this team is currently assigned to a
              member.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <tr>
                  <SortableHeader
                    activeField={sortBy}
                    direction={sortDirection}
                    field="ticketNumber"
                    label="Ticket #"
                    onSort={onSort}
                  />
                  <SortableHeader
                    activeField={sortBy}
                    direction={sortDirection}
                    field="title"
                    label="Title"
                    onSort={onSort}
                  />
                  <th className="px-5 py-3.5">Category</th>
                  <SortableHeader
                    activeField={sortBy}
                    direction={sortDirection}
                    field="status"
                    label="Status"
                    onSort={onSort}
                  />
                  <SortableHeader
                    activeField={sortBy}
                    direction={sortDirection}
                    field="priority"
                    label="Priority"
                    onSort={onSort}
                  />
                  <SortableHeader
                    activeField={sortBy}
                    direction={sortDirection}
                    field="createdBy"
                    label="Created By"
                    onSort={onSort}
                  />
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium dark:divide-slate-800/60">
                {tickets.items.map((ticket) => (
                  <tr
                    aria-label={`View ${ticket.ticketNumber}: ${ticket.ticketTitle}`}
                    className="group cursor-pointer transition-colors hover:bg-indigo-50/60 focus-visible:bg-indigo-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500/40 dark:hover:bg-violet-500/10 dark:focus-visible:bg-violet-500/10"
                    key={ticket.id}
                    onClick={() => router.push(`/tickets/${ticket.id}`)}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key !== "Enter" && event.key !== " ") return;

                      event.preventDefault();
                      router.push(`/tickets/${ticket.id}`);
                    }}
                    role="link"
                    tabIndex={0}
                  >
                    <td className="px-5 py-4 font-mono font-bold text-indigo-600 transition-colors group-hover:text-indigo-800 dark:text-violet-400 dark:group-hover:text-violet-300">
                      {ticket.ticketNumber}
                    </td>
                    <td className="max-w-60 truncate px-5 py-4 font-semibold text-slate-900 transition-colors group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-violet-300">
                      {ticket.ticketTitle}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {ticket.categoryName}
                    </td>
                    <td className="px-5 py-4">
                      <TicketStatusBadge status={ticket.statusName} />
                    </td>
                    <td className="px-5 py-4">
                      <TicketPriorityBadge priority={ticket.priorityName} />
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Avatar
                          avatarUrl={ticket.createdByAvatarUrl}
                          name={ticket.createdByName}
                          size="xs"
                        />
                        <div className="min-w-0">
                          <p className="max-w-36 truncate font-medium">
                            {ticket.createdByName}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                            <Clock3 className="h-3 w-3" />
                            {formatDate(ticket.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 shadow-sm transition-all hover:border-indigo-500 hover:bg-indigo-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:border-violet-500 dark:hover:bg-violet-600 dark:hover:text-white"
                        disabled={loading || assigning}
                        onClick={(event) => {
                          event.stopPropagation();
                          openAssignment(ticket);
                        }}
                        type="button"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Assign Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {tickets.items.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 px-1 sm:flex-row">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Showing {tickets.items.length} of {tickets.totalCount} waiting
            ticket(s)
          </p>
          <Pagination
            onChange={onPageChange}
            page={tickets.pageNumber}
            totalPages={tickets.totalPages}
          />
        </div>
      )}

      <Modal
        onClose={closeAssignment}
        open={selectedTicket !== null}
        title={`Assign ${selectedTicket?.ticketNumber ?? "ticket"}`}
      >
        {assignmentError && (
          <div className="mb-4">
            <Alert variant="error">{assignmentError}</Alert>
          </div>
        )}

        {selectedTicket && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {selectedTicket.ticketTitle}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Select an active member of {teamName} for this ticket.
            </p>
          </div>
        )}

        <TicketAssignmentForm
          currentTeamId={teamId}
          loading={assigning}
          lockToCurrentTeam
          onSubmit={handleAssign}
          requireTeamMember
        />
      </Modal>
    </section>
  );
}
