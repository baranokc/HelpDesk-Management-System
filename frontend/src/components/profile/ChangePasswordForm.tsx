"use client";

import { useState } from "react";
import { ChevronDown, KeyRound, ShieldAlert } from "lucide-react";
import { getApiErrorMessage } from "@/src/lib/api";
import { getFormErrors, type FormErrors } from "@/src/lib/validation";
import { changePasswordSchema } from "@/src/schemas/profileSchemas";
import { profileService } from "@/src/services/profileService";
import { useAuth } from "@/src/context/AuthContext";
import { Alert } from "@/src/components/ui/Alert";
import { Button } from "@/src/components/ui/Button";

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
    <section className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white/80 shadow-xl backdrop-blur-2xl dark:border-purple-900/40 dark:bg-slate-900/80">
      <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-600/20 bg-amber-500/10 text-amber-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-stone-900 dark:text-white">
              Password & Security
            </h2>
            <p className="text-[11px] text-stone-500 dark:text-slate-400">
              Updating your password terminates all active browser sessions.
            </p>
          </div>
        </div>

        <button
          aria-expanded={isExpanded}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300/80 bg-stone-100 px-3.5 py-2 text-xs font-bold text-stone-800 shadow-sm transition-all hover:border-emerald-600/40 hover:bg-stone-200 dark:border-purple-900/40 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-purple-500/50 dark:hover:bg-slate-700"
          onClick={() => {
            if (isExpanded) {
              handleClose();
            } else {
              setIsExpanded(true);
            }
          }}
          type="button"
        >
          <KeyRound className="h-3.5 w-3.5 text-amber-600 dark:text-purple-400" />
          <span>Change Password</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {isExpanded && (
        <form
          className="animate-in fade-in slide-in-from-top-2 border-t border-stone-100 bg-stone-50/50 p-6 duration-200 dark:border-slate-800/80 dark:bg-slate-950/20"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-500/10 p-3 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 font-medium">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>After saving your new password, you will be automatically logged out.</span>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="profile-current-password" className="text-xs font-semibold text-stone-700 dark:text-slate-300">
                Current Password
              </label>
              <input
                id="profile-current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => {
                  setCurrentPassword(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    currentPassword: undefined,
                  }));
                }}
                className="w-full rounded-xl border border-stone-300/80 bg-white px-3.5 py-2 text-xs text-stone-800 shadow-inner focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-purple-900/40 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-purple-500 dark:focus:ring-purple-500/20 transition-all"
              />
              {errors.currentPassword && (
                <p className="text-[10px] font-medium text-rose-500">{errors.currentPassword}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="profile-new-password" className="text-xs font-semibold text-stone-700 dark:text-slate-300">
                New Password
              </label>
              <input
                id="profile-new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    newPassword: undefined,
                  }));
                }}
                className="w-full rounded-xl border border-stone-300/80 bg-white px-3.5 py-2 text-xs text-stone-800 shadow-inner focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-purple-900/40 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-purple-500 dark:focus:ring-purple-500/20 transition-all"
              />
              {errors.newPassword && (
                <p className="text-[10px] font-medium text-rose-500">{errors.newPassword}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="profile-confirm-password" className="text-xs font-semibold text-stone-700 dark:text-slate-300">
                Confirm New Password
              </label>
              <input
                id="profile-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmNewPassword}
                onChange={(event) => {
                  setConfirmNewPassword(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    confirmNewPassword: undefined,
                  }));
                }}
                className="w-full rounded-xl border border-stone-300/80 bg-white px-3.5 py-2 text-xs text-stone-800 shadow-inner focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-purple-900/40 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-purple-500 dark:focus:ring-purple-500/20 transition-all"
              />
              {errors.confirmNewPassword && (
                <p className="text-[10px] font-medium text-rose-500">{errors.confirmNewPassword}</p>
              )}
            </div>
          </div>

          {(requestError || success) && (
            <div className="mt-4">
              <Alert variant={requestError ? "error" : "success"}>
                {requestError ?? success}
              </Alert>
            </div>
          )}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              className="!rounded-xl !border-stone-300 !bg-white !font-bold !text-stone-700 shadow-sm dark:!border-slate-700 dark:!bg-slate-900 dark:!text-slate-300 hover:!bg-stone-100 dark:hover:!bg-slate-800"
              disabled={saving}
              onClick={handleClose}
              size="sm"
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              className="!inline-flex !items-center !gap-2 !px-5 !py-2 !rounded-xl !text-xs !font-bold !text-white !bg-gradient-to-r !from-emerald-600 !to-teal-700 dark:!from-purple-600 dark:!to-indigo-600 hover:!from-emerald-500 hover:!to-teal-600 dark:hover:!from-purple-500 dark:hover:!to-indigo-500 shadow-md shadow-emerald-700/20 dark:shadow-purple-600/30 transition-all"
              loading={saving}
              size="sm"
              type="submit"
            >
              <KeyRound aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Update Password</span>
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}