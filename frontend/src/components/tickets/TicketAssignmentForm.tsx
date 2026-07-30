"use client";

import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { lookupService } from "@/src/services/lookupService";
import {
  LookupItemDto,
  TeamMemberLookupDto,
} from "@/src/types/common";
import { TicketAssignmentDto } from "@/src/types/ticket-assignment";
import { Button } from "@/src/components/ui/Button";
import { Select } from "@/src/components/ui/Select";
import { Textarea } from "@/src/components/ui/Textarea";

interface TicketAssignmentFormProps {
  loading?: boolean;
  onSubmit: (dto: TicketAssignmentDto) => Promise<void>;
}

export function TicketAssignmentForm({
  loading = false,
  onSubmit,
}: TicketAssignmentFormProps) {
  const [teams, setTeams] = useState<LookupItemDto[]>([]);
  const [members, setMembers] = useState<TeamMemberLookupDto[]>([]);
  const [teamId, setTeamId] = useState("");
  const [teamMemberId, setTeamMemberId] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    lookupService.getTeams().then(setTeams);
  }, []);

  useEffect(() => {
    if (!teamId) return;
    lookupService.getTeamMembers(teamId).then(setMembers);
  }, [teamId]);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      teamId,
      teamMemberId: teamMemberId || null,
      reason: reason || null,
    });
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Select
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
        disabled={!teamId}
        label="Team Member"
        onChange={(event) => setTeamMemberId(event.target.value)}
        options={members.map((member) => ({
          value: member.userId,
          label: `${member.fullName} — ${member.roleInTeam}`,
        }))}
        placeholder="Only assign to a team member"
        value={teamMemberId}
      />
      <Textarea
        hint={`${reason.length}/250 karakter`}
        label="Assignment Reason"
        maxLength={250}
        onChange={(event) => setReason(event.target.value)}
        value={reason}
      />
      <div className="flex justify-end">
        <Button loading={loading} type="submit">
          Assign ticket
        </Button>
      </div>
    </form>
  );
}
