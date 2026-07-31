"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  type SubmitEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/src/components/ui/Button";
import {
  type FormErrors,
  getFormErrors,
} from "@/src/lib/validation";
import { loginSchema } from "@/src/schemas/authSchemas";
import { authService } from "@/src/services/authService";

export function LoginForm() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);
  const [validationErrors, setValidationErrors] =
    useState<FormErrors>({});

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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
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
              <label
                className="label"
                htmlFor="password"
              >
                <span className="label-text font-medium text-slate-700">
                  Password
                </span>
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
  );
}
