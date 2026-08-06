"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEventHandler } from "react";
import { isAxiosError } from "axios";
import { Alert } from "@/src/components/ui/Alert";
import { Button } from "@/src/components/ui/Button";
import { authService } from "@/src/services/authService";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";
  const token = searchParams.get("token")?.trim() ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalidLink = !email || !token;

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("The password must be at least 6 characters long.");
      return;
    }

    if (newPassword.length > 128) {
      setError("The password cannot exceed 128 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("The password confirmation does not match.");
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword({
        email,
        token,
        newPassword,
        confirmNewPassword,
      });
      setSuccess(true);
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (caughtError) {
      const message = isAxiosError<{ message?: string }>(caughtError)
        ? caughtError.response?.data?.message
        : undefined;

      setError(
        message ??
          "The password reset link is invalid, expired or has already been used."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Enter and confirm your new password.
        </p>

        {invalidLink ? (
          <div className="mt-6 space-y-4">
            <Alert variant="error">
              The password reset link is invalid or incomplete.
            </Alert>
            <Link
              href="/login"
              className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Return to Sign In
            </Link>
          </div>
        ) : success ? (
          <div className="mt-6 space-y-4">
            <Alert variant="success">
              Your password has been reset successfully. You can now sign in
              with your new password.
            </Alert>
            <Link
              href="/login"
              className="block w-full rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && <Alert variant="error">{error}</Alert>}

            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              >
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={6}
                maxLength={128}
                required
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="confirmNewPassword"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              >
                Confirm New Password
              </label>
              <input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                minLength={6}
                maxLength={128}
                required
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>

            <Link
              href="/login"
              className="block text-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Return to Sign In
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
