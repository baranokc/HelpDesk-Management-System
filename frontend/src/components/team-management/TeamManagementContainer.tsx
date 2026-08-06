"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gauge, MessageSquare, Star, Zap } from "lucide-react";
import { Alert } from "@/src/components/ui/Alert";
import { TicketPriorityBadge } from "@/src/components/tickets/TicketPriorityBadge";
import { TicketStatsCards } from "@/src/components/tickets/TicketStatsCards";
import { TicketStatusBadge } from "@/src/components/tickets/TicketStatusBadge";
import { TicketUrgencyBadge } from "@/src/components/tickets/TicketUrgencyBadge";
import { useAuth } from "@/src/context/AuthContext";
import { getApiErrorMessage } from "@/src/lib/api";
import { teamManagementService } from "@/src/services/teamManagementService";
import type { TeamManagementOverviewDto } from "@/src/types/team-management";

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
        <div className="skeleton h-8 w-64 bg-slate-200 dark:bg-slate-800" />
        <div className="skeleton h-4 w-96 max-w-full bg-slate-200 dark:bg-slate-800" />
      </div>
      <TicketStatsCards loading showCsat />
      {[1, 2, 3].map((item) => (
        <div
          className="skeleton h-48 w-full rounded-xl bg-slate-200 dark:bg-slate-800"
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
        const response =
          await teamManagementService.getOverview(selectedTeamId);

        if (!cancelled) {
          setOverview(response);
          setSelectedTeamId(response.teamId);
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
  }, [authLoading, selectedTeamId, user?.role]);

  if (authLoading || user?.role !== "TeamLeader") {
    return <OverviewSkeleton />;
  }

  if (loading && !overview) return <OverviewSkeleton />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Team Management
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {overview
              ? `Monitor ${overview.teamName} tickets and member workload.`
              : "Monitor your team tickets and member workload."}
          </p>
        </div>

        {overview && overview.managedTeams.length > 1 && (
          <label className="form-control w-full sm:w-72">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Team
            </span>
            <select
              className="select select-bordered w-full border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              disabled={loading}
              onChange={(event) => setSelectedTeamId(event.target.value)}
              value={selectedTeamId}
            >
              {overview.managedTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {overview && (
        <>
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

          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Users
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Active team members and their five most recently assigned active
                tickets.
              </p>
            </div>

            {overview.members.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                This team has no active members.
              </div>
            ) : (
              <div className="space-y-4">
                {overview.members.map((member) => (
                  <Link
                    className="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
                    href={`/tickets/team-management/${member.teamMemberId}`}
                    key={member.teamMemberId}
                  >
                    <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800 lg:flex-row lg:items-center">
                      <div className="min-w-0 lg:flex-1">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                          {member.fullName} - {member.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Team member since {formatDate(member.joinedAt)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/50">
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

                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        View member details →
                      </span>
                    </div>

                    {member.recentTickets.length === 0 ? (
                      <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        No tickets are currently assigned to this member.
                      </p>
                    ) : (
                      <div>
                        <div className="hidden grid-cols-[minmax(0,1fr)_7rem_7rem_7rem] items-center gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400 md:grid">
                          <span>Ticket</span>
                          <span className="text-center">Priority</span>
                          <span className="text-center">Urgency</span>
                          <span className="text-center">Status</span>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {member.recentTickets.map((ticket) => (
                            <div
                              className="grid gap-3 px-5 py-3 text-sm transition-colors group-hover:bg-slate-50/70 dark:group-hover:bg-slate-800/30 md:grid-cols-[minmax(0,1fr)_7rem_7rem_7rem] md:items-center"
                              key={ticket.id}
                            >
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900 dark:text-white">
                                  {ticket.ticketTitle}
                                </p>
                                <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                                  {ticket.ticketNumber}
                                  {ticket.assignedAt
                                    ? ` · Assigned ${formatDate(ticket.assignedAt)}`
                                    : ""}
                                </p>
                              </div>
                              <div>
                                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400 md:hidden">
                                  Priority
                                </span>
                                <TicketPriorityBadge
                                  priority={ticket.priorityName}
                                />
                              </div>
                              <div>
                                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400 md:hidden">
                                  Urgency
                                </span>
                                <TicketUrgencyBadge
                                  urgency={ticket.urgencyLevelName}
                                />
                              </div>
                              <div>
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
