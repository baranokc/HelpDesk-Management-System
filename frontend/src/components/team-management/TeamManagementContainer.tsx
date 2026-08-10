"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  Gauge,
  MessageSquare,
  Star,
  UsersRound,
  Zap,
} from "lucide-react";
import { Alert } from "@/src/components/ui/Alert";
import { Avatar } from "@/src/components/ui/Avatar";
import { TicketPriorityBadge } from "@/src/components/tickets/TicketPriorityBadge";
import { TicketStatsCards } from "@/src/components/tickets/TicketStatsCards";
import { TicketStatusBadge } from "@/src/components/tickets/TicketStatusBadge";
import { UnassignedTeamTickets } from "@/src/components/team-management/UnassignedTeamTickets";
import { useAuth } from "@/src/context/AuthContext";
import { getApiErrorMessage } from "@/src/lib/api";
import { teamManagementService } from "@/src/services/teamManagementService";
import type { TeamManagementOverviewDto } from "@/src/types/team-management";

const UNASSIGNED_TICKETS_PAGE_SIZE = 10;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      <TicketStatsCards loading showCsat />
      {[1, 2, 3].map((item) => (
        <div
          className="h-48 w-full animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          key={item}
        />
      ))}
    </div>
  );
}

export function TeamManagementContainer() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string>();
  const [overview, setOverview] = useState<TeamManagementOverviewDto | null>(
    null,
  );
  const [unassignedPageNumber, setUnassignedPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user?.role !== "TeamLeader") {
      router.replace("/tickets");
    }
  }, [authLoading, router, user?.role]);

  useEffect(() => {
    if (authLoading || user?.role !== "TeamLeader") return;

    let cancelled = false;

    const fetchOverview = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await teamManagementService.getOverview(
          selectedTeamId,
          unassignedPageNumber,
          UNASSIGNED_TICKETS_PAGE_SIZE,
        );

        if (!cancelled) {
          setOverview(response);
          setSelectedTeamId(response.teamId);
          setUnassignedPageNumber(response.unassignedTickets.pageNumber);
        }
      } catch (requestError: unknown) {
        if (!cancelled) {
          setOverview(null);
          setError(
            getApiErrorMessage(
              requestError,
              "Failed to load team management data. Please try again.",
            ),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchOverview();

    return () => {
      cancelled = true;
    };
  }, [authLoading, selectedTeamId, unassignedPageNumber, user?.role]);

  const refreshOverview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await teamManagementService.getOverview(
        overview?.teamId ?? selectedTeamId,
        unassignedPageNumber,
        UNASSIGNED_TICKETS_PAGE_SIZE,
      );

      setOverview(response);
      setSelectedTeamId(response.teamId);
      setUnassignedPageNumber(response.unassignedTickets.pageNumber);
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(
          requestError,
          "The ticket was assigned, but the management data could not be refreshed.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user?.role !== "TeamLeader") {
    return <OverviewSkeleton />;
  }

  if (loading && !overview) return <OverviewSkeleton />;

  return (
    <div className="space-y-6">
      <div className="animate-in fade-in slide-in-from-bottom-3 flex flex-col gap-4 duration-500 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Team Management
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {overview
              ? `Monitor ${overview.teamName} tickets and member workload.`
              : "Monitor your team tickets and member workload."}
          </p>
        </div>

        {overview && overview.managedTeams.length > 1 && (
          <label className="w-full space-y-1.5 sm:w-72">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Team
            </span>
            <span className="relative block">
              <select
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm font-semibold text-slate-900 shadow-sm outline-none transition-all hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-indigo-700"
                disabled={loading}
                onChange={(event) => {
                  setUnassignedPageNumber(1);
                  setSelectedTeamId(event.target.value);
                }}
                value={selectedTeamId}
              >
                {overview.managedTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-500" />
            </span>
          </label>
        )}
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {overview && (
        <>
          <div
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: "100ms" }}
          >
            <TicketStatsCards
              csatAverage={overview.csat.averageRating}
              csatSurveyCount={overview.csat.totalSurveysCount}
              completedCount={overview.stats.completedCount}
              inProgressCount={overview.stats.inProgressCount}
              loading={loading}
              openCount={overview.stats.openCount}
              showCsat
              totalCount={overview.stats.totalCount}
              totalDescription="Tickets assigned to this team"
            />
          </div>

          <UnassignedTeamTickets
            loading={loading}
            onAssigned={refreshOverview}
            onPageChange={setUnassignedPageNumber}
            teamId={overview.teamId}
            teamName={overview.teamName}
            tickets={overview.unassignedTickets}
          />

          <section
            className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-500"
            style={{ animationDelay: "200ms" }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Team Members
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Active members and their five most recently assigned active
                  tickets.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                <UsersRound className="h-3.5 w-3.5" />
                {overview.members.length} active member(s)
              </span>
            </div>

            {overview.members.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-500">
                  <UsersRound className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No active members
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  This team currently has no active members.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {overview.members.map((member) => (
                  <Link
                    className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-indigo-500/40"
                    href={`/tickets/team-management/${member.teamMemberId}`}
                    key={member.teamMemberId}
                  >
                    <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800/80 lg:flex-row lg:items-center">
                      <div className="flex min-w-0 items-center gap-3 lg:flex-1">
                        <Avatar name={member.fullName} size="md" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                              {member.fullName}
                            </h3>
                            <span className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {member.roleInTeam}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {member.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                            Team member since {formatDate(member.joinedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 dark:border-slate-700/80 dark:bg-slate-950/40">
                        {member.csat.totalSurveysCount > 0 ? (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                            <span className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                              <Star className="h-4 w-4 fill-current" />
                              Overall {member.csat.averageRating.toFixed(1)}
                            </span>
                            <span className="flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-400">
                              <MessageSquare className="h-4 w-4" />
                              Communication{" "}
                              {member.csat.averageCommunicationRating.toFixed(
                                1,
                              )}
                            </span>
                            <span className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                              <Zap className="h-4 w-4" />
                              Solution{" "}
                              {member.csat.averageSolutionRating.toFixed(1)}
                            </span>
                            <span className="flex items-center gap-1.5 font-semibold text-violet-700 dark:text-violet-400">
                              <Gauge className="h-4 w-4" />
                              Speed {member.csat.averageSpeedRating.toFixed(1)}
                            </span>
                            <span className="font-medium text-slate-500 dark:text-slate-400">
                              {member.csat.totalSurveysCount}{" "}
                              {member.csat.totalSurveysCount === 1
                                ? "survey"
                                : "surveys"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            No CSAT surveys yet
                          </span>
                        )}
                      </div>

                      <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 shadow-sm transition-all group-hover:border-indigo-500 group-hover:bg-indigo-600 group-hover:text-white dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-300 dark:group-hover:border-violet-500 dark:group-hover:bg-violet-600 dark:group-hover:text-white">
                        View Details
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>

                    {member.recentTickets.length === 0 ? (
                      <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        No tickets are currently assigned to this member.
                      </p>
                    ) : (
                      <div>
                        <div className="hidden grid-cols-[minmax(0,1fr)_7rem_7rem] items-center gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400 md:grid">
                          <span>Ticket</span>
                          <span className="text-center">Priority</span>
                          <span className="text-center">Status</span>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {member.recentTickets.map((ticket) => (
                            <div
                              className="grid gap-3 px-5 py-3.5 text-sm transition-colors group-hover:bg-slate-50/70 dark:group-hover:bg-slate-800/30 md:grid-cols-[minmax(0,1fr)_7rem_7rem] md:items-center"
                              key={ticket.id}
                            >
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900 dark:text-white">
                                  {ticket.ticketTitle}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                    {ticket.ticketNumber}
                                  </span>
                                  {ticket.assignedAt
                                    ? ` · Assigned ${formatDate(ticket.assignedAt)}`
                                    : ""}
                                </p>
                              </div>
                              <div className="flex items-center justify-start md:justify-center">
                                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400 md:hidden">
                                  Priority
                                </span>
                                <TicketPriorityBadge
                                  priority={ticket.priorityName}
                                  urgency={ticket.urgencyLevelName}
                                />
                              </div>
                              <div className="flex items-center justify-start md:justify-center">
                                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400 md:hidden">
                                  Status
                                </span>
                                <TicketStatusBadge status={ticket.statusName} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
