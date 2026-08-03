"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  type SubmitEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/src/components/ui/Button";
import {
  type FormErrors,
  getFormErrors,
} from "@/src/lib/validation";
import { loginSchema } from "@/src/schemas/authSchemas";
import { authService } from "@/src/services/authService";
import { ForgotPasswordModal } from "./ForgotPassword";

export function LoginForm() {
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);
  const [validationErrors, setValidationErrors] =
    useState<FormErrors>({});

  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMessage(
        "Account created successfully! You can now sign in.",
      );
    }
  }, [searchParams]);

  const handleSubmit = async (
    event: SubmitEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError(null);
    setSuccessMessage(null);

    const result = loginSchema.safeParse({
      email,
      password,
    });

    if (!result.success) {
      setValidationErrors(
        getFormErrors(result.error),
      );
      return;
    }

    setValidationErrors({});
    setLoading(true);

    try {
      await authService.login(result.data);

      // authService tokeni localStorage'a kaydeder.
      // Tam yenileme AuthContext'in yeni token ile kurulmasını sağlar.
      window.location.href = "/tickets";
    } catch (caughtError: unknown) {
      const errorMessage =
        (
          caughtError as {
            response?: {
              data?: {
                message?: string;
              };
            };
          }
        )?.response?.data?.message ??
        "Failed to sign in. Please check your credentials.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        {/* Sağ Üst Köşe Theme Toggle Button */}
        {mounted && (
          <div className="absolute top-4 right-4 z-10">
            <label className="swap swap-rotate btn btn-ghost btn-circle btn-sm">
              <input
                type="checkbox"
                checked={theme === "dark"}
                onChange={(e) =>
                  setTheme(e.target.checked ? "dark" : "light")
                }
              />

              {/* Sun Icon (Light Mode) */}
              <svg
                className="swap-on h-5 w-5 fill-current text-slate-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
              </svg>

              {/* Moon Icon (Dark Mode) */}
              <svg
                className="swap-off h-5 w-5 fill-current text-slate-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,10,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
              </svg>
            </label>
          </div>
        )}

        <div className="card w-full max-w-md border border-slate-200 bg-white shadow-lg">
          <div className="card-body">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-900">
                Sign In to Your Account
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Log in to manage your support tickets
              </p>
            </div>

            {successMessage && (
              <div
                className="alert alert-success mt-4 text-sm text-white shadow-sm"
                role="status"
              >
                <span>{successMessage}</span>
              </div>
            )}

            {error && (
              <div
                className="alert alert-error mt-4 text-sm text-white shadow-sm"
                role="alert"
              >
                <span>{error}</span>
              </div>
            )}

            <form
              className="mt-4 space-y-4"
              noValidate
              onSubmit={handleSubmit}
            >
              <div className="form-control w-full">
                <label className="label" htmlFor="email">
                  <span className="label-text font-medium text-slate-700">
                    Email Address
                  </span>
                </label>

                <input
                  aria-describedby={
                    validationErrors.email
                      ? "email-error"
                      : undefined
                  }
                  aria-invalid={Boolean(
                    validationErrors.email,
                  )}
                  className={`input input-bordered w-full bg-white text-sm text-slate-900 focus:input-primary ${
                    validationErrors.email
                      ? "input-error"
                      : ""
                  }`}
                  id="email"
                  name="email"
                  onChange={(event) => {
                    setEmail(event.target.value);

                    setValidationErrors((current) => ({
                      ...current,
                      email: undefined,
                    }));
                  }}
                  placeholder="name@example.com"
                  required
                  type="email"
                  value={email}
                />

                {validationErrors.email && (
                  <p
                    className="mt-1 text-sm text-error"
                    id="email-error"
                  >
                    {validationErrors.email}
                  </p>
                )}
              </div>

              <div className="form-control w-full">
                {/* PASSWORD LABEL & FORGOT PASSWORD LINK */}
                <label
                  className="label flex items-center justify-between"
                  htmlFor="password"
                >
                  <span className="label-text font-medium text-slate-700">
                    Password
                  </span>

                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    className="label-text-alt font-medium text-blue-600 hover:text-blue-700 hover:underline focus:outline-none"
                  >
                    Forgot password?
                  </button>
                </label>

                <input
                  aria-describedby={
                    validationErrors.password
                      ? "password-error"
                      : undefined
                  }
                  aria-invalid={Boolean(
                    validationErrors.password,
                  )}
                  className={`input input-bordered w-full bg-white text-sm text-slate-900 focus:input-primary ${
                    validationErrors.password
                      ? "input-error"
                      : ""
                  }`}
                  id="password"
                  name="password"
                  onChange={(event) => {
                    setPassword(event.target.value);

                    setValidationErrors((current) => ({
                      ...current,
                      password: undefined,
                    }));
                  }}
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                />

                {validationErrors.password && (
                  <p
                    className="mt-1 text-sm text-error"
                    id="password-error"
                  >
                    {validationErrors.password}
                  </p>
                )}
              </div>

              <div className="form-control mt-6">
                <Button
                  className="w-full"
                  loading={loading}
                  type="submit"
                >
                  {loading
                    ? "Signing In..."
                    : "Sign In"}
                </Button>
              </div>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-slate-600">
                Don&apos;t have an account?{" "}
              </span>

              <Link
                className="link link-primary font-medium"
                href="/register"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      />
    </>
  );
}