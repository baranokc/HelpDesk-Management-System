import * as z from "zod";

const nameField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} is required.` })
    .max(100, { error: `${label} cannot exceed 100 characters.` });

export const updateProfileSchema = z.object({
  firstName: nameField("First name"),
  lastName: nameField("Last name"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { error: "Current password is required." }),
    newPassword: z
      .string()
      .min(6, { error: "New password must be at least 6 characters long." })
      .max(128, { error: "New password cannot exceed 128 characters." }),
    confirmNewPassword: z
      .string()
      .min(1, { error: "Password confirmation is required." }),
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    path: ["newPassword"],
    error: "New password must be different from the current password.",
  })
  .refine((value) => value.newPassword === value.confirmNewPassword, {
    path: ["confirmNewPassword"],
    error: "New password and confirmation do not match.",
  });

export const avatarFileSchema = z
  .custom<File>(
    (value) => typeof File !== "undefined" && value instanceof File,
    { error: "Please select an avatar file." },
  )
  .refine((file) => file.size > 0, {
    error: "The avatar file cannot be empty.",
  })
  .refine((file) => file.size <= 2 * 1024 * 1024, {
    error: "The avatar file cannot exceed 2 MB.",
  })
  .refine(
    (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    { error: "Only JPEG, PNG, and WebP avatar files are allowed." },
  );
