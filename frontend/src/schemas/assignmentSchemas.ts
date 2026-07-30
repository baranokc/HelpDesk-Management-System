import * as z from "zod";

import {
  optionalGuid,
  optionalText,
  requiredGuid,
} from "./shared";

export const ticketAssignmentSchema = z.object({
  teamId: requiredGuid(
    "Please select a support team.",
    "The selected team ID is invalid.",
  ),

  teamMemberId: optionalGuid(
    "The selected team member ID is invalid.",
  ),

  reason: optionalText(
    250,
    "The assignment reason cannot exceed 250 characters.",
  ),
});

export const ticketUnassignmentSchema =
  z.object({
    reason: optionalText(
      250,
      "The unassignment reason cannot exceed 250 characters.",
    ),

    keepTeamAssignment: z.boolean({
      error:
        "The keep team assignment value must be true or false.",
    }),
  });

export type TicketAssignmentDto =
  z.output<typeof ticketAssignmentSchema>;

export type TicketUnassignmentDto =
  z.output<typeof ticketUnassignmentSchema>;