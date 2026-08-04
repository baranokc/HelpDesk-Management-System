"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/src/components/ui/Alert";
import { Pagination } from "@/src/components/ui/Pagination";
import { TicketPriorityBadge } from "@/src/components/tickets/TicketPriorityBadge";
import { TicketStatsCards } from "@/src/components/tickets/TicketStatsCards";
import { TicketStatusBadge } from "@/src/components/tickets/TicketStatusBadge";
import { TicketUrgencyBadge } from "@/src/components/tickets/TicketUrgencyBadge";
import { useAuth } from "@/src/context/AuthContext";
import { getApiErrorMessage } from "@/src/lib/api";
import { teamManagementService } from "@/src/services/teamManagementService";
import type { PagedResultDto } from "@/src/types/common";
import type { TeamMemberDetailDto, TeamMemberTicketDto, } from "@/src/types/team-management";

interface TeamMemberDetailContainerProps {
  teamMemberId?: string;
  selfView?: boolean;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getRelationship(
  created: boolean,
  assigned: boolean,
): string {
  if (created && assigned) return "Created & Assigned";
  if (assigned) return "Assigned";
  return "Created";
}

interface MemberTicketListProps {
  title: string;
  description: string;
  emptyMessage: string;
  result: PagedResultDto<TeamMemberTicketDto>;
  onPageChange: (pageNumber: number) => void;
}

function MemberTicketList({
  title,
  description,
  emptyMessage,
  result,
  onPageChange,
}: MemberTicketListProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {result.items.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            {emptyMessage}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table min-w-[1050px]">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                <tr>
                  <th>Ticket</th>
                  <th>Title</th>
                  <th>Relation</th>
                  <th>Priority</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Latest Assignment</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
                {result.items.map((ticket) => (
                  <tr
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    key={ticket.id}
                  >
                    <td className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {ticket.ticketNumber}
                    </td>
                    <td className="max-w-xs font-medium text-slate-900 dark:text-white">
                      {ticket.ticketTitle}
                    </td>
                    <td>
                      <span className="badge badge-outline h-7 whitespace-nowrap border-slate-300 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
                        {getRelationship(
                          ticket.isCreatedByMember,
                          ticket.isAssignedToMember,
                        )}
                      </span>
                    </td>
                    <td>
                      <TicketPriorityBadge priority={ticket.priorityName} />
                    </td>
                    <td>
                      <TicketUrgencyBadge urgency={ticket.urgencyLevelName} />
                    </td>
                    <td>
                      <TicketStatusBadge status={ticket.statusName} />
                    </td>
                    <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {ticket.assignedAt
                        ? formatDate(ticket.assignedAt)
                        : "Not assigned"}
                    </td>
                    <td className="text-right">
                      <Link
                        className="link link-primary whitespace-nowrap font-medium no-underline hover:underline"
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
            {result.totalCount} ticket(s)
          </p>
          <Pagination
            onChange={onPageChange}
            page={result.pageNumber}
            totalPages={result.totalPages}
          />
        </div>
      )}
    </section>
  );
}

export function TeamMemberDetailContainer({
  teamMemberId,
  selfView = false,
}: TeamMemberDetailContainerProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activePageNumber, setActivePageNumber] = useState(1);
  const [inactivePageNumber, setInactivePageNumber] = useState(1);
  const [detail, setDetail] = useState<TeamMemberDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requiredRole = selfView ? "SupportAgent" : "TeamLeader";
  const canViewPage = user?.role === requiredRole;

  useEffect(() => {
    if (!authLoading && !canViewPage) {
      router.replace("/tickets");
    }
  }, [authLoading, canViewPage, router]);

  useEffect(() => {
    if (authLoading || !canViewPage || (!selfView && !teamMemberId)) return;

    let cancelled = false;

    const fetchMember = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = selfView
          ? await teamManagementService.getOwnMemberDetail(
              activePageNumber,
              inactivePageNumber,
              25,
            )
          : await teamManagementService.getMemberDetail(
              teamMemberId!,
              activePageNumber,
              inactivePageNumber,
              25,
            );

        if (!cancelled) setDetail(response);
      } catch (requestError: unknown) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(
              requestError,
              "Failed to load team member details. Please try again.",
            ),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchMember();

    return () => {
      cancelled = true;
    };
  }, [
    activePageNumber,
    authLoading,
    canViewPage,
    inactivePageNumber,
    selfView,
    teamMemberId,
  ]);

  if (authLoading || !canViewPage) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        href={selfView ? "/tickets" : "/tickets/team-management"}
      >
        ← {selfView ? "Back to Tickets" : "Back to Team Management"}
      </Link>

      {error && <Alert variant="error">{error}</Alert>}

      {!detail && loading && (
        <div className="space-y-6">
          <div className="skeleton h-44 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
          <TicketStatsCards loading />
          <div className="skeleton h-80 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      )}

      {detail && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {detail.teamName}
                </p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {detail.fullName}
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {detail.title}
                </p>
              </div>
              <span className="badge badge-outline h-8 border-blue-300 px-3 font-semibold text-blue-700 dark:border-blue-700 dark:text-blue-300">
                {detail.systemRole}
              </span>
            </div>

            <dl className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  First Name
                </dt>
                <dd className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {detail.firstName}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Last Name
                </dt>
                <dd className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {detail.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Role
                </dt>
                <dd className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {detail.title} · {detail.systemRole}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Registered At
                </dt>
                <dd className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {formatDate(detail.registeredAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Team Start Date
                </dt>
                <dd className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {formatDate(detail.joinedAt)}
                </dd>
              </div>
            </dl>
          </section>

          <TicketStatsCards
            completedCount={detail.stats.completedCount}
            inProgressCount={detail.stats.inProgressCount}
            loading={loading}
            openCount={detail.stats.openCount}
            totalCount={detail.stats.totalCount}
            totalDescription={
              selfView
                ? "Currently assigned to you"
                : "Created by or assigned to this member"
            }
          />

          <MemberTicketList
            title="Active Tickets"
            description={
              selfView
                ? "Open and ongoing tickets currently assigned to you."
                : "Open and ongoing tickets created by or currently assigned to this member."
            }
            emptyMessage={
              selfView
                ? "No active tickets are currently assigned to you."
                : "No active tickets were found for this member."
            }
            result={detail.activeTickets}
            onPageChange={setActivePageNumber}
          />

          <MemberTicketList
            title="Inactive Ticket List"
            description={
              selfView
                ? "Resolved, cancelled, and closed tickets currently assigned to you."
                : "Resolved, cancelled, and closed tickets associated with this member."
            }
            emptyMessage={
              selfView
                ? "No inactive tickets are currently assigned to you."
                : "No inactive tickets were found for this member."
            }
            result={detail.inactiveTickets}
            onPageChange={setInactivePageNumber}
          />
        </>
      )}
    </div>
  );
}
