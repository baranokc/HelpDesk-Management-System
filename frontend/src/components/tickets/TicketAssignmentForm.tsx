"use client";

import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { Users, UserCheck, MessageSquare, ArrowRight } from "lucide-react";
import { lookupService } from "@/src/services/lookupService";
import { LookupItemDto, TeamMemberLookupDto } from "@/src/types/common";
import { TicketAssignmentDto } from "@/src/types/ticket-assignment";
import { ticketAssignmentSchema } from "@/src/schemas/assignmentSchemas";
import { FormErrors, getFormErrors } from "@/src/lib/validation";
import { Button } from "@/src/components/ui/Button";

interface TicketAssignmentFormProps {
  currentTeamId?: string | null;
  lockToCurrentTeam?: boolean;
  requireTeamMember?: boolean;
  loading?: boolean;
  onSubmit: (dto: TicketAssignmentDto) => Promise<void>;
}

export function TicketAssignmentForm({
  currentTeamId,
  lockToCurrentTeam = false,
  requireTeamMember = false,
  loading = false,
  onSubmit,
}: TicketAssignmentFormProps) {
  const [teams, setTeams] = useState<LookupItemDto[]>([]);
  const [members, setMembers] = useState<TeamMemberLookupDto[]>([]);
  const [teamId, setTeamId] = useState(
    lockToCurrentTeam ? (currentTeamId ?? "") : "",
  );
  const [teamMemberId, setTeamMemberId] = useState("");
  const [reason, setReason] = useState("");
  const [validationErrors, setValidationErrors] = useState<FormErrors>({});
  
  const isCrossTeamTransfer = Boolean(
    currentTeamId && teamId && currentTeamId !== teamId
  );

  useEffect(() => {
    if (lockToCurrentTeam) return;
    lookupService.getTeams().then(setTeams);
  }, [lockToCurrentTeam]);

  useEffect(() => {
    if (!teamId || isCrossTeamTransfer) return;

    let cancelled = false;

    lookupService.getTeamMembers(teamId).then((response) => {
      if (!cancelled) setMembers(response);
    });

    return () => {
      cancelled = true;
    };
  }, [isCrossTeamTransfer, teamId]);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = ticketAssignmentSchema.safeParse({
      teamId,
      teamMemberId,
      reason,
    });

    if (!result.success) {
      setValidationErrors(getFormErrors(result.error));
      return;
    }

    if (requireTeamMember && !result.data.teamMemberId) {
      setValidationErrors({
        teamMemberId: "Please select a team member.",
      });
      return;
    }

    setValidationErrors({});
    await onSubmit(result.data);
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      {/* TAKIM SEÇİMİ */}
      {!lockToCurrentTeam && (
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-slate-300">
            <Users className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Support Team</span>
            <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              required
              value={teamId}
              onChange={(e) => {
                setTeamId(e.target.value);
                setTeamMemberId("");
                setMembers([]);
              }}
              className="w-full appearance-none rounded-xl border border-stone-300/80 dark:border-purple-900/40 bg-stone-50/70 dark:bg-slate-900/80 px-3.5 py-2.5 text-xs font-medium text-stone-800 dark:text-slate-100 shadow-inner focus:border-emerald-600 dark:focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-purple-500/20 transition-all"
            >
              <option value="" className="bg-stone-100 dark:bg-slate-900">
                Select support team...
              </option>
              {teams.map((team) => (
                <option
                  key={team.itemId}
                  value={team.itemId}
                  className="bg-stone-100 dark:bg-slate-900"
                >
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          {validationErrors.teamId && (
            <p className="text-[11px] font-medium text-rose-500">
              {validationErrors.teamId}
            </p>
          )}
        </div>
      )}

      {/* TAKIM ÜYESİ SEÇİMİ */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-slate-300">
          <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Team Member</span>
          {requireTeamMember && <span className="text-rose-500">*</span>}
        </label>
        <select
          disabled={!teamId || isCrossTeamTransfer}
          value={teamMemberId}
          onChange={(e) => setTeamMemberId(e.target.value)}
          className="w-full appearance-none rounded-xl border border-stone-300/80 dark:border-purple-900/40 bg-stone-50/70 dark:bg-slate-900/80 px-3.5 py-2.5 text-xs font-medium text-stone-800 dark:text-slate-100 shadow-inner focus:border-emerald-600 dark:focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="" className="bg-stone-100 dark:bg-slate-900">
            {requireTeamMember
              ? "Select team member..."
              : isCrossTeamTransfer
              ? "The new team leader will assign a member"
              : "Unassigned (Team queue)"}
          </option>
          {members.map((member) => (
            <option key={member.teamMemberId} value={member.teamMemberId} className="bg-stone-100 dark:bg-slate-900">
              {member.fullName} ({member.roleInTeam})
            </option>
          ))}
        </select>
        {validationErrors.teamMemberId && (
          <p className="text-[11px] font-medium text-rose-500">{validationErrors.teamMemberId}</p>
        )}
      </div>

      {/* NEDEN / AÇIKLAMA */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-slate-300">
            <MessageSquare className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Assignment Reason</span>
          </label>
          <span className="text-[10px] text-stone-400 dark:text-slate-500 font-mono">{reason.length}/250</span>
        </div>
        <textarea
          rows={3}
          maxLength={250}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why are you assigning or transferring this ticket? (optional)"
          className="w-full rounded-xl border border-stone-300/80 dark:border-purple-900/40 bg-stone-50/70 dark:bg-slate-900/80 p-3 text-xs text-stone-800 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 shadow-inner focus:border-emerald-600 dark:focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-purple-500/20 transition-all resize-none"
        />
        {validationErrors.reason && (
          <p className="text-[11px] font-medium text-rose-500">{validationErrors.reason}</p>
        )}
      </div>

      {/* AKSİYON BUTONU */}
      <div className="flex justify-end pt-3 border-t border-stone-200/80 dark:border-slate-800/80">
        <Button
          loading={loading}
          type="submit"
          className="!inline-flex !items-center !gap-2 !px-5 !py-2.5 !rounded-xl !text-xs !font-bold !text-white !bg-gradient-to-r !from-emerald-600 !to-teal-700 dark:!from-purple-600 dark:!to-indigo-600 hover:!from-emerald-500 hover:!to-teal-600 dark:hover:!from-purple-500 dark:hover:!to-indigo-500 shadow-md shadow-emerald-700/20 dark:shadow-purple-600/30 active:scale-[0.98] transition-all"
        >
          <span>{isCrossTeamTransfer ? "Transfer to Team" : "Assign Ticket"}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </form>
  );
}
