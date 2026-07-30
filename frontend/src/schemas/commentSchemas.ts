import * as z from "zod";

import {
  MB,
  createFileSchema,
} from "./shared";

const commentFileSchema = createFileSchema(
  100 * MB,
  "Each file must be smaller than or equal to 100 MB.",
);

export const ticketCommentCreateSchema =
  z.object({
    comment: z
      .string()
      .trim()
      .min(1, {
        error: "The comment cannot be empty.",
      })
      .max(1000, {
        error:
          "The comment cannot exceed 1,000 characters.",
      }),

    attachments: z
      .array(commentFileSchema)
      .max(10, {
        error:
          "A comment can contain a maximum of 10 files.",
      }),

    isInternal: z.boolean({
      error:
        "The internal comment value must be true or false.",
    }),
  });

export const ticketCommentUpdateSchema =
  z.object({
    comment: z
      .string()
      .trim()
      .min(1, {
        error: "The comment cannot be empty.",
      })
      .max(4000, {
        error:
          "The comment cannot exceed 4,000 characters.",
      }),

    isInternal: z.boolean({
      error:
        "The internal comment value must be true or false.",
    }),
  });

export type TicketCommentCreateDto =
  z.output<typeof ticketCommentCreateSchema>;

export type TicketCommentUpdateDto =
  z.output<typeof ticketCommentUpdateSchema>;