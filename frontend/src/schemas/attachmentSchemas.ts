import * as z from "zod";

import {
  MB,
  createFileSchema,
  optionalGuid,
  optionalText,
} from "./shared";

const attachmentFileSchema = createFileSchema(
  100 * MB,
  "Each file must be smaller than or equal to 100 MB.",
);

export const ticketAttachmentCreateSchema =
  z.object({
    files: z
      .array(attachmentFileSchema)
      .min(1, {
        error:
          "Please select at least one file.",
      })
      .max(10, {
        error:
          "You can upload a maximum of 10 files.",
      }),

    commentId: optionalGuid(
      "The selected comment ID is invalid.",
    ),

    description: optionalText(
      100,
      "The file description cannot exceed 100 characters.",
    ),
  });

export const ticketAttachmentUpdateSchema =
  z.object({
    description: optionalText(
      500,
      "The file description cannot exceed 500 characters.",
    ),
  });

export type TicketAttachmentCreateDto =
  z.output<typeof ticketAttachmentCreateSchema>;

export type TicketAttachmentUpdateDto =
  z.output<typeof ticketAttachmentUpdateSchema>;