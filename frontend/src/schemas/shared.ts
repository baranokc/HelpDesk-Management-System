import * as z from "zod";

export const MB = 1024 * 1024;

const EMPTY_GUID =
  "00000000-0000-0000-0000-000000000000";

const allowedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".pdf",
  ".txt",
  ".docx",
  ".xlsx",
  ".zip",
  ".rar",
  ".7z",
]);

export const requiredGuid = (
  requiredMessage: string,
  invalidMessage = "Invalid ID format.",
) =>
  z
    .string({ error: requiredMessage })
    .trim()
    .min(1, { error: requiredMessage })
    .pipe(
      z
        .guid({ error: invalidMessage })
        .refine(
          (value) => value !== EMPTY_GUID,
          { error: invalidMessage },
        ),
    );

export const optionalGuid = (
  invalidMessage: string,
) =>
  z.preprocess(
    (value) =>
      value === "" || value == null
        ? null
        : value,
    z
      .guid({ error: invalidMessage })
      .refine(
        (value) => value !== EMPTY_GUID,
        { error: invalidMessage },
      )
      .nullable(),
  );

export const optionalText = (
  maximumLength: number,
  message: string,
) =>
  z.preprocess(
    (value) =>
      typeof value === "string" &&
      value.trim() === ""
        ? null
        : value ?? null,
    z
      .string()
      .trim()
      .max(maximumLength, { error: message })
      .nullable(),
  );

function getExtension(fileName: string) {
  const lastDot = fileName.lastIndexOf(".");

  return lastDot > 0
    ? fileName.slice(lastDot).toLowerCase()
    : "";
}

export const createFileSchema = (
  maximumBytes: number,
  sizeMessage: string,
) =>
  z
    .file({ error: "Invalid file." })
    .min(1, {
      error: "The file cannot be empty.",
    })
    .max(maximumBytes, {
      error: sizeMessage,
    })
    .refine(
      (file) =>
        allowedExtensions.has(
          getExtension(file.name),
        ),
      {
        error: "Unsupported file extension.",
      },
    );