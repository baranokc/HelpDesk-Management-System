import * as z from "zod";

import {
  optionalGuid,
  optionalText,
  requiredGuid,
} from "./shared";

export const ticketStatusUpdateSchema =
  z.object({
    ticketId: requiredGuid(
      "A valid ticket must be selected.",
      "The selected ticket ID is invalid.",
    ),

    statusId: requiredGuid(
      "Please select a new ticket status.",
      "The selected status ID is invalid.",
    ),

    reason: optionalText(
      250,
      "The status change reason cannot exceed 250 characters.",
    ),
  });

export const ticketResolveSchema = z.object({
  resolution: z
    .string()
    .trim()
    .min(10, {
      error:
        "The resolution must be at least 10 characters long.",
    })
    .max(250, {
      error:
        "The resolution cannot exceed 250 characters.",
    }),

  resolutionCategoryId: optionalGuid(
    "The selected resolution category ID is invalid.",
  ),

  internalNote: optionalText(
    250,
    "The internal note cannot exceed 250 characters.",
  ),
});

export type TicketStatusUpdateDto =
  z.output<typeof ticketStatusUpdateSchema>;

export type TicketResolveDto =
  z.output<typeof ticketResolveSchema>;