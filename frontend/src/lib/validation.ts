import * as z from "zod";

export type FormErrors = Record<
  string,
  string | undefined
>;

export function getFormErrors(
  error: z.ZodError,
): FormErrors {
  const errors: FormErrors = {};

  for (const issue of error.issues) {
    const firstPath = issue.path[0];

    const fieldName =
      typeof firstPath === "string"
        ? firstPath
        : "_form";


    if (!errors[fieldName]) {
      errors[fieldName] = issue.message;
    }
  }

  return errors;
}