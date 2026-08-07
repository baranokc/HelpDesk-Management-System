"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Edit3,
  Save,
  ShieldCheck,
  Ticket,
  Trash2,
} from "lucide-react";
import { Alert } from "@/src/components/ui/Alert";
import { Avatar } from "@/src/components/ui/Avatar";
import { Pagination } from "@/src/components/ui/Pagination";
import { TicketPriorityBadge } from "@/src/components/tickets/TicketPriorityBadge";
import { TicketStatsCards } from "@/src/components/tickets/TicketStatsCards";
import { TicketStatusBadge } from "@/src/components/tickets/TicketStatusBadge";
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
  const isActiveList = title.toLowerCase().startsWith("active");

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                isActiveList
                  ? "border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400"
                  : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <Ticket className="h-4 w-4" />
            </span>
            {title}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          {result.totalCount} ticket(s)
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        {result.items.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-500">
              <Ticket className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No tickets found
            </h3>
            <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Ticket #</th>
                  <th className="px-5 py-3.5">Title</th>
                  <th className="px-5 py-3.5">Relation</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Latest Assignment</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800/60">
                {result.items.map((ticket) => (
                  <tr
                    className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    key={ticket.id}
                  >
                    <td className="px-5 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {ticket.ticketNumber}
                    </td>
                    <td className="max-w-xs truncate px-5 py-4 font-semibold text-slate-900 dark:text-white">
                      {ticket.ticketTitle}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex h-7 items-center whitespace-nowrap rounded-lg border border-slate-200 bg-slate-100 px-2.5 text-[11px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {getRelationship(
                          ticket.isCreatedByMember,
                          ticket.isAssignedToMember,
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <TicketPriorityBadge
                        priority={ticket.priorityName}
                        urgency={ticket.urgencyLevelName}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <TicketStatusBadge status={ticket.statusName} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-600 dark:text-slate-300">
                      {ticket.assignedAt
                        ? formatDate(ticket.assignedAt)
                        : "Not assigned"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        className="inline-flex items-center gap-1 whitespace-nowrap font-bold text-indigo-600 transition-all hover:text-indigo-500 group-hover:translate-x-0.5 dark:text-violet-400 dark:hover:text-violet-300"
                        href={`/tickets/${ticket.id}`}
                      >
                        View Details
                        <ArrowRight className="h-3.5 w-3.5" />
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
        <div className="flex flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Showing{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {result.items.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {result.totalCount}
            </span>{" "}
            ticket(s)
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
        <span className="loading loading-spinner loading-lg text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:border-violet-500 dark:hover:bg-violet-600 dark:hover:text-white"
        href={selfView ? "/tickets" : "/tickets/team-management"}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {selfView ? "Back to Tickets" : "Back to Team Management"}
      </Link>

      {error && <Alert variant="error">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {!detail && loading && (
        <div className="space-y-6">
          <div className="h-44 w-full animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          <TicketStatsCards loading />
          <div className="h-80 w-full animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        </div>
      )}

      {detail && (
        <>
          <section className="animate-in fade-in slide-in-from-bottom-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm duration-500 dark:border-slate-800 dark:bg-slate-900/80">
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
            <div className="p-6">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <Avatar name={detail.fullName} size="lg" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {selfView ? "My Work" : detail.teamName}
                    </p>
                    <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {detail.fullName}
                    </h1>
                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {detail.title} · {detail.teamName}
                    </p>
                  </div>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <ShieldCheck className="h-4 w-4" />
                  {detail.systemRole}
                </span>
              </div>

              <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    First Name
                  </dt>
                  <dd className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {detail.firstName}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Last Name
                  </dt>
                  <dd className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {detail.lastName}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Role
                  </dt>
                  <dd className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">
                    {detail.roleInTeam}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Registered At
                  </dt>
                  <dd className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {formatDate(detail.registeredAt)}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Team Start Date
                  </dt>
                  <dd className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {formatDate(detail.joinedAt)}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {!selfView && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <div className="p-6">
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-400">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Work Schedule & Leave
                      </h2>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Manage this team member&apos;s weekly shift and leave
                        periods.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Clock3 className="h-3.5 w-3.5 text-violet-500" />
                    {detail.schedule.timeZoneId}
                  </span>
                </div>

                <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] border-collapse text-left">
                      <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                        <tr>
                          <th className="px-5 py-3">Working Day</th>
                          <th className="px-5 py-3">Start</th>
                          <th className="px-5 py-3">End</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm dark:divide-slate-800/60">
                        {shiftRows.map((row) => (
                          <tr
                            className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                            key={row.dayOfWeek}
                          >
                            <td className="px-5 py-3">
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
                            <td className="px-5 py-3">
                              <input
                                className="input input-bordered input-sm w-36 rounded-lg border-slate-200 bg-white text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
                            <td className="px-5 py-3">
                              <input
                                className="input input-bordered input-sm w-36 rounded-lg border-slate-200 bg-white text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
                </div>

                {!selfView && (
                  <div className="mt-5 flex justify-end">
                    <button
                      className="btn btn-outline btn-primary min-w-44 rounded-xl border-indigo-300 bg-indigo-50/70 font-bold text-indigo-700 shadow-sm transition-all hover:bg-indigo-600 hover:text-white dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-600 dark:hover:text-white"
                      disabled={scheduleSaving}
                      onClick={() => void handleSaveSchedule()}
                      type="button"
                    >
                      {scheduleSaving ? (
                        <span className="loading loading-spinner loading-sm" />
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Shift Schedule
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
                  <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                    <CalendarDays className="h-4 w-4 text-amber-500" />
                    Leave Periods
                  </h3>

                  {!selfView && (
                    <div className="mt-4 grid gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50 md:grid-cols-2 xl:grid-cols-4">
                      <label className="space-y-1.5">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Start Date
                        </span>
                        <input
                          className="input input-bordered w-full rounded-xl border-slate-200 bg-white text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          onChange={(event) =>
                            setLeaveStartDate(event.target.value)
                          }
                          type="date"
                          value={leaveStartDate}
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          End Date
                        </span>
                        <input
                          className="input input-bordered w-full rounded-xl border-slate-200 bg-white text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          min={leaveStartDate || undefined}
                          onChange={(event) =>
                            setLeaveEndDate(event.target.value)
                          }
                          type="date"
                          value={leaveEndDate}
                        />
                      </label>
                      <label className="space-y-1.5 md:col-span-2 xl:col-span-1">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Reason
                        </span>
                        <input
                          className="input input-bordered w-full rounded-xl border-slate-200 bg-white text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          maxLength={500}
                          onChange={(event) =>
                            setLeaveReason(event.target.value)
                          }
                          placeholder="Annual leave, medical leave..."
                          type="text"
                          value={leaveReason}
                        />
                      </label>
                      <div className="flex items-end gap-2">
                        {editingLeaveId && (
                          <button
                            className="btn btn-outline rounded-xl border-slate-300 bg-white font-bold text-slate-700 shadow-sm dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-600 dark:hover:text-white"
                            disabled={leaveSaving}
                            onClick={cancelLeaveEdit}
                            type="button"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          className="btn btn-outline btn-primary w-full rounded-xl border-indigo-300 bg-indigo-50/70 font-bold text-indigo-700 shadow-sm hover:bg-indigo-600 hover:text-white dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-600 dark:hover:text-white"
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
                            <>
                              <Save className="h-4 w-4" />
                              Save Leave
                            </>
                          ) : (
                            <>
                              <CalendarDays className="h-4 w-4" />
                              Add Leave
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                    {detail.schedule.leaves.length === 0 ? (
                      <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        No leave period has been registered.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] border-collapse text-left">
                          <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                            <tr>
                              <th className="px-5 py-3">Date Range</th>
                              <th className="px-5 py-3">Reason</th>
                              <th className="px-5 py-3">Added By</th>
                              {!selfView && (
                                <th className="px-5 py-3 text-right">Action</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {detail.schedule.leaves.map((leave) => (
                              <tr
                                className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                                key={leave.id}
                              >
                                <td className="whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                  {formatDateOnly(leave.startDate)} –{" "}
                                  {formatDateOnly(leave.endDate)}
                                </td>
                                <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300">
                                  {leave.reason}
                                </td>
                                <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">
                                  {leave.createdByName}
                                </td>
                                {!selfView && (
                                  <td className="px-5 py-3.5 text-right">
                                    <div className="flex justify-end gap-2">
                                      <button
                                        className="btn btn-outline btn-sm rounded-lg border-slate-300 bg-white text-slate-700 shadow-sm dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-600 dark:hover:text-white"
                                        onClick={() => handleEditLeave(leave)}
                                        type="button"
                                      >
                                        <Edit3 className="h-3.5 w-3.5" />
                                        Edit
                                      </button>
                                      <button
                                        className="btn btn-outline btn-error btn-sm rounded-lg bg-rose-50/70 font-semibold shadow-sm dark:bg-rose-500/10"
                                        onClick={() =>
                                          void handleDeleteLeave(leave.id)
                                        }
                                        type="button"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
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
              </div>
            </section>
          )}

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          </div>

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
