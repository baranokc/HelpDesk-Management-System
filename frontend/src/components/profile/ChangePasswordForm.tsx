"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { getApiErrorMessage } from "@/src/lib/api";
import { getFormErrors, type FormErrors } from "@/src/lib/validation";
import { changePasswordSchema } from "@/src/schemas/profileSchemas";
import { profileService } from "@/src/services/profileService";
import { useAuth } from "@/src/context/AuthContext";
import { Alert } from "@/src/components/ui/Alert";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";

export function ChangePasswordForm() {
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestError(null);
    setSuccess(null);

    const validation = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmNewPassword,
    });

    if (!validation.success) {
      setErrors(getFormErrors(validation.error));
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      await profileService.changePassword(validation.data);
      setSuccess("Password changed successfully. Redirecting to sign in...");
      window.setTimeout(logout, 1200);
    } catch (error: unknown) {
      setRequestError(
        getApiErrorMessage(error, "Failed to change the password."),
      );
      setSaving(false);
    }
  };

  return (
    <Card
      description="Changing your password signs out all sessions for this account."
      title="Security"
    >
      <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
        <Input
          autoComplete="current-password"
          error={errors.currentPassword}
          id="profile-current-password"
          label="Current password"
          onChange={(event) => {
            setCurrentPassword(event.target.value);
            setErrors((current) => ({ ...current, currentPassword: undefined }));
          }}
          type="password"
          value={currentPassword}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            autoComplete="new-password"
            error={errors.newPassword}
            id="profile-new-password"
            label="New password"
            onChange={(event) => {
              setNewPassword(event.target.value);
              setErrors((current) => ({ ...current, newPassword: undefined }));
            }}
            type="password"
            value={newPassword}
          />

          <Input
            autoComplete="new-password"
            error={errors.confirmNewPassword}
            id="profile-confirm-password"
            label="Confirm new password"
            onChange={(event) => {
              setConfirmNewPassword(event.target.value);
              setErrors((current) => ({
                ...current,
                confirmNewPassword: undefined,
              }));
            }}
            type="password"
            value={confirmNewPassword}
          />
        </div>

        {(requestError || success) && (
          <Alert variant={requestError ? "error" : "success"}>
            {requestError ?? success}
          </Alert>
        )}

        <div className="flex justify-end">
          <Button loading={saving} type="submit">
            <KeyRound aria-hidden="true" className="h-4 w-4" />
            Change password
          </Button>
        </div>
      </form>
    </Card>
  );
}
