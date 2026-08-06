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
import type {
  TeamMemberDetailDto,
  TeamMemberLeaveDto,
  TeamMemberShiftDto,
  TeamMemberTicketDto,
} from "@/src/types/team-management";

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

function formatDateOnly(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

interface ShiftRow {
  dayOfWeek: number;
  label: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

const weekDays = [
  { dayOfWeek: 1, label: "Monday" },
  { dayOfWeek: 2, label: "Tuesday" },
  { dayOfWeek: 3, label: "Wednesday" },
  { dayOfWeek: 4, label: "Thursday" },
  { dayOfWeek: 5, label: "Friday" },
  { dayOfWeek: 6, label: "Saturday" },
  { dayOfWeek: 0, label: "Sunday" },
] as const;

function normalizeTime(value: string): string {
  return value.slice(0, 5);
}

function buildShiftRows(shifts: TeamMemberShiftDto[]): ShiftRow[] {
  return weekDays.map((day) => {
    const shift = shifts.find((item) => item.dayOfWeek === day.dayOfWeek);

    return {
      dayOfWeek: day.dayOfWeek,
      label: day.label,
      enabled: Boolean(shift),
      startTime: shift ? normalizeTime(shift.startTime) : "09:00",
      endTime: shift ? normalizeTime(shift.endTime) : "18:00",
    };
  });
}

function getRelationship(created: boolean, assigned: boolean): string {
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [shiftRows, setShiftRows] = useState<ShiftRow[]>(() =>
    buildShiftRows([]),
  );
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [leaveSaving, setLeaveSaving] = useState(false);
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);
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

        if (!cancelled) {
          setDetail(response);
          setShiftRows(buildShiftRows(response.schedule.shifts));
        }
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

  const updateShiftRow = (dayOfWeek: number, changes: Partial<ShiftRow>) => {
    setShiftRows((current) =>
      current.map((row) =>
        row.dayOfWeek === dayOfWeek ? { ...row, ...changes } : row,
      ),
    );
  };

  const handleSaveSchedule = async () => {
    if (!detail || selfView) return;

    setScheduleSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const schedule = await teamManagementService.updateMemberSchedule(
        detail.teamMemberId,
        {
          shifts: shiftRows
            .filter((row) => row.enabled)
            .map((row) => ({
              dayOfWeek: row.dayOfWeek,
              startTime: `${row.startTime}:00`,
              endTime: `${row.endTime}:00`,
            })),
        },
      );

      setDetail((current) => (current ? { ...current, schedule } : current));
      setShiftRows(buildShiftRows(schedule.shifts));
      setSuccessMessage("The weekly shift schedule was updated.");
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(
          requestError,
          "Failed to update the weekly shift schedule.",
        ),
      );
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleAddLeave = async () => {
    if (!detail || selfView) return;

    setLeaveSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const request = {
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        reason: leaveReason.trim(),
      };

      const leave = editingLeaveId
        ? await teamManagementService.updateMemberLeave(
            detail.teamMemberId,
            editingLeaveId,
            request,
          )
        : await teamManagementService.addMemberLeave(
            detail.teamMemberId,
            request,
          );

      setDetail((current) =>
        current
          ? {
              ...current,
              schedule: {
                ...current.schedule,
                leaves: editingLeaveId
                  ? current.schedule.leaves.map((item) =>
                      item.id === leave.id ? leave : item,
                    )
                  : [leave, ...current.schedule.leaves],
              },
            }
          : current,
      );
      setLeaveStartDate("");
      setLeaveEndDate("");
      setLeaveReason("");
      setEditingLeaveId(null);
      setSuccessMessage(
        editingLeaveId
          ? "The leave period was updated."
          : "The leave period was added.",
      );
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(
          requestError,
          editingLeaveId
            ? "Failed to update the leave period."
            : "Failed to add the leave period.",
        ),
      );
    } finally {
      setLeaveSaving(false);
    }
  };

  const handleEditLeave = (leave: TeamMemberLeaveDto) => {
    setEditingLeaveId(leave.id);
    setLeaveStartDate(leave.startDate);
    setLeaveEndDate(leave.endDate);
    setLeaveReason(leave.reason);
    setError(null);
    setSuccessMessage(null);
  };

  const cancelLeaveEdit = () => {
    setEditingLeaveId(null);
    setLeaveStartDate("");
    setLeaveEndDate("");
    setLeaveReason("");
  };

  const handleDeleteLeave = async (leaveId: string) => {
    if (!detail || selfView) return;

    const confirmed = window.confirm(
      "Remove this leave period from the team member?",
    );
    if (!confirmed) return;

    setError(null);
    setSuccessMessage(null);

    try {
      await teamManagementService.deleteMemberLeave(
        detail.teamMemberId,
        leaveId,
      );

      setDetail((current) =>
        current
          ? {
              ...current,
              schedule: {
                ...current.schedule,
                leaves: current.schedule.leaves.filter(
                  (leave) => leave.id !== leaveId,
                ),
              },
            }
          : current,
      );
      if (editingLeaveId === leaveId) {
        setEditingLeaveId(null);
        setLeaveStartDate("");
        setLeaveEndDate("");
        setLeaveReason("");
      }
      setSuccessMessage("The leave period was removed.");
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(requestError, "Failed to remove the leave period."),
      );
    }
  };

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
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

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

          {!selfView && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Work Schedule & Leave
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {selfView
                      ? "Your weekly shift and registered leave periods."
                      : "Manage this team member's weekly shift and leave periods."}
                  </p>
                </div>
                <span className="badge badge-outline h-8 border-slate-300 px-3 font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
                  {detail.schedule.timeZoneId}
                </span>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="table min-w-[650px]">
                  <thead className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    <tr>
                      <th>Working Day</th>
                      <th>Start</th>
                      <th>End</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {shiftRows.map((row) => (
                      <tr key={row.dayOfWeek}>
                        <td>
                          <label className="flex cursor-pointer items-center gap-3 font-semibold text-slate-800 dark:text-slate-200">
                            <input
                              checked={row.enabled}
                              className="checkbox checkbox-sm checkbox-primary"
                              disabled={selfView}
                              onChange={(event) =>
                                updateShiftRow(row.dayOfWeek, {
                                  enabled: event.target.checked,
                                })
                              }
                              type="checkbox"
                            />
                            {row.label}
                          </label>
                        </td>
                        <td>
                          <input
                            className="input input-bordered input-sm w-36 bg-white dark:border-slate-700 dark:bg-slate-950"
                            disabled={selfView || !row.enabled}
                            onChange={(event) =>
                              updateShiftRow(row.dayOfWeek, {
                                startTime: event.target.value,
                              })
                            }
                            type="time"
                            value={row.startTime}
                          />
                        </td>
                        <td>
                          <input
                            className="input input-bordered input-sm w-36 bg-white dark:border-slate-700 dark:bg-slate-950"
                            disabled={selfView || !row.enabled}
                            onChange={(event) =>
                              updateShiftRow(row.dayOfWeek, {
                                endTime: event.target.value,
                              })
                            }
                            type="time"
                            value={row.endTime}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!selfView && (
                <div className="mt-5 flex justify-end">
                  <button
                    className="btn btn-outline btn-primary min-w-40"
                    disabled={scheduleSaving}
                    onClick={() => void handleSaveSchedule()}
                    type="button"
                  >
                    {scheduleSaving ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      "Save Shift Schedule"
                    )}
                  </button>
                </div>
              )}

              <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Leave Periods
                </h3>

                {!selfView && (
                  <div className="mt-4 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50 md:grid-cols-2 xl:grid-cols-4">
                    <label className="form-control">
                      <span className="mb-1 text-xs font-semibold uppercase text-slate-500">
                        Start Date
                      </span>
                      <input
                        className="input input-bordered bg-white dark:border-slate-700 dark:bg-slate-950"
                        onChange={(event) =>
                          setLeaveStartDate(event.target.value)
                        }
                        type="date"
                        value={leaveStartDate}
                      />
                    </label>
                    <label className="form-control">
                      <span className="mb-1 text-xs font-semibold uppercase text-slate-500">
                        End Date
                      </span>
                      <input
                        className="input input-bordered bg-white dark:border-slate-700 dark:bg-slate-950"
                        min={leaveStartDate || undefined}
                        onChange={(event) =>
                          setLeaveEndDate(event.target.value)
                        }
                        type="date"
                        value={leaveEndDate}
                      />
                    </label>
                    <label className="form-control md:col-span-2 xl:col-span-1">
                      <span className="mb-1 text-xs font-semibold uppercase text-slate-500">
                        Reason
                      </span>
                      <input
                        className="input input-bordered bg-white dark:border-slate-700 dark:bg-slate-950"
                        maxLength={500}
                        onChange={(event) => setLeaveReason(event.target.value)}
                        placeholder="Annual leave, medical leave..."
                        type="text"
                        value={leaveReason}
                      />
                    </label>
                    <div className="flex items-end gap-2">
                      {editingLeaveId && (
                        <button
                          className="btn btn-outline"
                          disabled={leaveSaving}
                          onClick={cancelLeaveEdit}
                          type="button"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        className="btn btn-outline btn-primary w-full"
                        disabled={
                          leaveSaving ||
                          !leaveStartDate ||
                          !leaveEndDate ||
                          !leaveReason.trim()
                        }
                        onClick={() => void handleAddLeave()}
                        type="button"
                      >
                        {leaveSaving ? (
                          <span className="loading loading-spinner loading-sm" />
                        ) : editingLeaveId ? (
                          "Save Leave"
                        ) : (
                          "Add Leave"
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                  {detail.schedule.leaves.length === 0 ? (
                    <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      No leave period has been registered.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table min-w-[700px]">
                        <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
                          <tr>
                            <th>Date Range</th>
                            <th>Reason</th>
                            <th>Added By</th>
                            {!selfView && (
                              <th className="text-right">Action</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {detail.schedule.leaves.map((leave) => (
                            <tr key={leave.id}>
                              <td className="whitespace-nowrap font-semibold text-slate-800 dark:text-slate-200">
                                {formatDateOnly(leave.startDate)} –{" "}
                                {formatDateOnly(leave.endDate)}
                              </td>
                              <td className="text-slate-700 dark:text-slate-300">
                                {leave.reason}
                              </td>
                              <td className="text-slate-600 dark:text-slate-400">
                                {leave.createdByName}
                              </td>
                              {!selfView && (
                                <td className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      className="btn btn-outline btn-sm"
                                      onClick={() => handleEditLeave(leave)}
                                      type="button"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="btn btn-outline btn-error btn-sm"
                                      onClick={() =>
                                        void handleDeleteLeave(leave.id)
                                      }
                                      type="button"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

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