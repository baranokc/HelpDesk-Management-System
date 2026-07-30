import * as z from "zod";

import {
  MB,
  createFileSchema,
  optionalGuid,
  optionalText,
  requiredGuid,
} from "./shared";

const ticketFields = {
  ticketTitle: z
    .string()
    .trim()
    .min(5, {
      error:
        "The ticket title must be at least 5 characters long.",
    })
    .max(50, {
      error:
        "The ticket title cannot exceed 50 characters.",
    }),

  ticketDescription: z
    .string()
    .trim()
    .min(5, {
      error:
        "The ticket summary must be at least 5 characters long.",
    })
    .max(100, {
      error:
        "The ticket summary cannot exceed 100 characters.",
    }),

  subject: z
    .string()
    .trim()
    .min(5, {
      error:
        "The detailed description must be at least 5 characters long.",
    })
    .max(10_000, {
      error:
        "The detailed description cannot exceed 10,000 characters.",
    }),

  categoryId: requiredGuid(
    "Please select a category.",
    "The selected category ID is invalid.",
  ),

  subcategoryId: optionalGuid(
    "The selected subcategory ID is invalid.",
  ),

  priorityId: requiredGuid(
    "Please select a priority.",
    "The selected priority ID is invalid.",
  ),

  impactLevelId: requiredGuid(
    "Please select an impact level.",
    "The selected impact level ID is invalid.",
  ),

  urgencyLevelId: requiredGuid(
    "Please select an urgency level.",
    "The selected urgency level ID is invalid.",
  ),
};

const ticketFileSchema = createFileSchema(
  10 * MB,
  "Each file must be smaller than or equal to 10 MB.",
);

export const ticketCreateSchema = z.object({
  ...ticketFields,

  attachments: z
    .array(ticketFileSchema)
    .max(10, {
      error:
        "A ticket can contain a maximum of 10 files.",
    })
    .refine(
      (files) =>
        files.reduce(
          (total, file) => total + file.size,
          0,
        ) <= 100 * MB,
      {
        error:
          "The total file size cannot exceed 100 MB.",
      },
    ),
});

export const ticketUpdateSchema =
  z.object(ticketFields);

const optionalDateSchema = z.preprocess(
  (value) =>
    value === "" || value == null
      ? null
      : value,
  z
    .iso
    .date({
      error: "Please enter a valid date.",
    })
    .nullable(),
);

export const ticketFilterSchema = z
  .object({
    search: optionalText(
      200,
      "The search text cannot exceed 200 characters.",
    ),

    statusId: optionalGuid(
      "The selected status ID is invalid.",
    ),

    categoryId: optionalGuid(
      "The selected category ID is invalid.",
    ),

    assignedToId: optionalGuid(
      "The selected assignee ID is invalid.",
    ),

    createdById: optionalGuid(
      "The selected creator ID is invalid.",
    ),

    urgencyLevelId: optionalGuid(
      "The selected urgency level ID is invalid.",
    ),

    impactLevelId: optionalGuid(
      "The selected impact level ID is invalid.",
    ),

    createdFrom: optionalDateSchema,
    createdTo: optionalDateSchema,

    pageNumber: z.coerce
      .number()
      .int({
        error:
          "The page number must be a whole number.",
      })
      .min(1, {
        error:
          "The page number must be at least 1.",
      })
      .default(1),

    pageSize: z.coerce
      .number()
      .int({
        error:
          "The page size must be a whole number.",
      })
      .min(1, {
        error:
          "The page size must be at least 1.",
      })
      .max(100, {
        error:
          "The page size cannot exceed 100.",
      })
      .default(25),
  })
  .superRefine((value, context) => {
    if (
      value.createdFrom &&
      value.createdTo &&
      value.createdFrom > value.createdTo
    ) {
      context.addIssue({
        code: "custom",
        path: ["createdTo"],
        message:
          "The end date cannot be earlier than the start date.",
      });
    }
  });

export type TicketCreateDto =
  z.output<typeof ticketCreateSchema>;

export type TicketUpdateDto =
  z.output<typeof ticketUpdateSchema>;

export type TicketFilterDto =
  z.output<typeof ticketFilterSchema>;