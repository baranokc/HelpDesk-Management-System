"use client";

import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { lookupService } from "@/src/services/lookupService";
import { LookupItemDto, TeamMemberLookupDto } from "@/src/types/common";
import { TicketAssignmentDto } from "@/src/types/ticket-assignment";
import { ticketAssignmentSchema } from "@/src/schemas/assignmentSchemas";
import { FormErrors, getFormErrors } from "@/src/lib/validation";
import { Button } from "@/src/components/ui/Button";
import { Select } from "@/src/components/ui/Select";
import { Textarea } from "@/src/components/ui/Textarea";

interface TicketAssignmentFormProps {
  currentTeamId?: string | null;
  loading?: boolean;
  onSubmit: (dto: TicketAssignmentDto) => Promise<void>;
}

export function TicketAssignmentForm({
  currentTeamId,
  loading = false,
  onSubmit,
}: TicketAssignmentFormProps) {
  const [teams, setTeams] = useState<LookupItemDto[]>([]);
  const [members, setMembers] = useState<TeamMemberLookupDto[]>([]);
  const [teamId, setTeamId] = useState("");
  const [teamMemberId, setTeamMemberId] = useState("");
  const [reason, setReason] = useState("");
  const [validationErrors, setValidationErrors] = useState<FormErrors>({});
  const isCrossTeamTransfer = Boolean(
    currentTeamId && teamId && currentTeamId !== teamId,
  );

  useEffect(() => {
    lookupService.getTeams().then(setTeams);
  }, []);

  useEffect(() => {
    if (!teamId || isCrossTeamTransfer) {
      setMembers([]);
      setTeamMemberId("");
      return;
    }

    lookupService.getTeamMembers(teamId).then(setMembers);
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

    setValidationErrors({});
    await onSubmit(result.data);
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Select
        error={validationErrors.teamId}
        label="Support Team"
        onChange={(event) => {
          setTeamId(event.target.value);
          setTeamMemberId("");
          setMembers([]);
        }}
        options={teams.map((team) => ({
          value: team.itemId,
          label: team.name,
        }))}
        required
        value={teamId}
      />
      <Select
        disabled={!teamId || isCrossTeamTransfer}
        error={validationErrors.teamMemberId}
        label="Team Member"
        onChange={(event) => setTeamMemberId(event.target.value)}
        options={members.map((member) => ({
          value: member.teamMemberId,
          label: `${member.fullName} — ${member.roleInTeam}`,
        }))}
        placeholder={
          isCrossTeamTransfer
            ? "The new team leader will assign a member"
            : "Only assign to a team member"
        }
        value={teamMemberId}
      />
      <Textarea
        error={validationErrors.reason}
        hint={`${reason.length}/250 characters`}
        label="Assignment Reason"
        maxLength={250}
        onChange={(event) => setReason(event.target.value)}
        value={reason}
      />
      <div className="flex justify-end">
        <Button loading={loading} type="submit">
          {isCrossTeamTransfer ? "Transfer to team" : "Assign ticket"}
        </Button>
      </div>
    </form>
  );
}
