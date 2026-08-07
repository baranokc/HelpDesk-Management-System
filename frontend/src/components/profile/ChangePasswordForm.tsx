"use client";

import { useState } from "react";
import { ChevronDown, KeyRound } from "lucide-react";
import { getApiErrorMessage } from "@/src/lib/api";
import { getFormErrors, type FormErrors } from "@/src/lib/validation";
import { changePasswordSchema } from "@/src/schemas/profileSchemas";
import { profileService } from "@/src/services/profileService";
import { useAuth } from "@/src/context/AuthContext";
import { Alert } from "@/src/components/ui/Alert";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";

export function ChangePasswordForm() {
  const { logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleClose = () => {
    if (saving) return;

    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setErrors({});
    setRequestError(null);
    setSuccess(null);
    setIsExpanded(false);
  };

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
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-400">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Password & Security
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Changing your password signs out every active session.
            </p>
          </div>
        </div>

        <button
          aria-expanded={isExpanded}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-300 bg-violet-50/70 px-3.5 py-2 text-xs font-bold text-violet-700 shadow-sm transition-all hover:bg-violet-600 hover:text-white dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-600 dark:hover:text-white"
          onClick={() => {
            if (isExpanded) {
              handleClose();
            } else {
              setIsExpanded(true);
            }
          }}
          type="button"
        >
          <KeyRound className="h-3.5 w-3.5" />
          Change password
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {isExpanded && (
        <form
          className="animate-in fade-in slide-in-from-top-2 border-t border-slate-100 bg-slate-50/50 p-5 duration-200 dark:border-slate-800 dark:bg-slate-950/20"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <Input
              autoComplete="current-password"
              className="rounded-xl border-slate-200 bg-white text-slate-900 transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              error={errors.currentPassword}
              id="profile-current-password"
              label="Current password"
              onChange={(event) => {
                setCurrentPassword(event.target.value);
                setErrors((current) => ({
                  ...current,
                  currentPassword: undefined,
                }));
              }}
              type="password"
              value={currentPassword}
            />

            <Input
              autoComplete="new-password"
              className="rounded-xl border-slate-200 bg-white text-slate-900 transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              error={errors.newPassword}
              id="profile-new-password"
              label="New password"
              onChange={(event) => {
                setNewPassword(event.target.value);
                setErrors((current) => ({
                  ...current,
                  newPassword: undefined,
                }));
              }}
              type="password"
              value={newPassword}
            />

            <Input
              autoComplete="new-password"
              className="rounded-xl border-slate-200 bg-white text-slate-900 transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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
            <div className="mt-4">
              <Alert variant={requestError ? "error" : "success"}>
                {requestError ?? success}
              </Alert>
            </div>
          )}

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              className="!rounded-xl !border-slate-300 !bg-white !font-bold !text-slate-700 shadow-sm dark:!border-violet-500/30 dark:!bg-violet-500/10 dark:!text-violet-300 dark:hover:!bg-violet-600 dark:hover:!text-white"
              disabled={saving}
              onClick={handleClose}
              size="sm"
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              className="!min-w-40 !rounded-xl !border-violet-300 !bg-violet-50/70 !font-bold !text-violet-700 shadow-sm transition-all hover:!bg-violet-600 hover:!text-white dark:!border-violet-500/40 dark:!bg-violet-500/10 dark:!text-violet-300 dark:hover:!bg-violet-600 dark:hover:!text-white"
              loading={saving}
              size="sm"
              type="submit"
            >
              <KeyRound aria-hidden="true" className="h-4 w-4" />
              Change password
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
