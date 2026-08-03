"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  type SubmitEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/src/components/ui/Button";
import {
  type FormErrors,
  getFormErrors,
} from "@/src/lib/validation";
import { registerSchema } from "@/src/schemas/authSchemas";
import { authService } from "@/src/services/authService";
import { AuthCard } from "./AuthCard";
import { AuthMessage } from "./AuthMessage";

const departments = [
  { id: "1", name: "Software" },
  { id: "2", name: "Human Resources" },
  {
    id: "3",
    name: "Information Technologies (IT)",
  },
  { id: "4", name: "Customer Services" },
];

export function RegisterForm() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [departmentId, setDepartmentId] =
    useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] =
    useState<FormErrors>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (
    event: SubmitEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError(null);

    const result = registerSchema.safeParse({
      name,
      lastName,
      email,
      password,
      departmentId,
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
      await authService.register(result.data);
      router.push("/login?registered=true");
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
        )?.response?.data?.message ||
        "Registration failed. Please check your information.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearValidationError = (
    fieldName: string,
  ) => {
    setValidationErrors((current) => ({
      ...current,
      [fieldName]: undefined,
    }));
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      {/* SAĞ ÜST KÖŞE TEMA BUTONU */}
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

      <AuthCard
        title="Create New Account"
        description="Enter your details to join the Helpdesk system"
        footer={
          <>
            <span className="text-slate-600">
              Already have an account?{" "}
            </span>

            <Link
              className="link link-primary font-medium"
              href="/login"
            >
              Sign In
            </Link>
          </>
        }
      >
        {error && (
          <AuthMessage
            message={error}
            variant="error"
          />
        )}

        <form
          className="mt-4 space-y-4"
          noValidate
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label" htmlFor="name">
                <span className="label-text font-medium text-slate-700">
                  First Name
                </span>
              </label>

              <input
                aria-describedby={
                  validationErrors.name
                    ? "name-error"
                    : undefined
                }
                aria-invalid={Boolean(
                  validationErrors.name,
                )}
                className={`input input-bordered w-full bg-white text-sm text-slate-900 focus:input-primary ${
                  validationErrors.name
                    ? "input-error"
                    : ""
                }`}
                id="name"
                onChange={(event) => {
                  setName(event.target.value);
                  clearValidationError("name");
                }}
                placeholder="John"
                required
                type="text"
                value={name}
              />

              {validationErrors.name && (
                <p
                  className="mt-1 text-sm text-error"
                  id="name-error"
                >
                  {validationErrors.name}
                </p>
              )}
            </div>

            <div className="form-control w-full">
              <label
                className="label"
                htmlFor="lastName"
              >
                <span className="label-text font-medium text-slate-700">
                  Last Name
                </span>
              </label>

              <input
                aria-describedby={
                  validationErrors.lastName
                    ? "last-name-error"
                    : undefined
                }
                aria-invalid={Boolean(
                  validationErrors.lastName,
                )}
                className={`input input-bordered w-full bg-white text-sm text-slate-900 focus:input-primary ${
                  validationErrors.lastName
                    ? "input-error"
                    : ""
                }`}
                id="lastName"
                onChange={(event) => {
                  setLastName(event.target.value);
                  clearValidationError("lastName");
                }}
                placeholder="Doe"
                required
                type="text"
                value={lastName}
              />

              {validationErrors.lastName && (
                <p
                  className="mt-1 text-sm text-error"
                  id="last-name-error"
                >
                  {validationErrors.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="form-control w-full">
            <label className="label" htmlFor="email">
              <span className="label-text font-medium text-slate-700">
                Email Address
              </span>
            </label>

            <input
              aria-describedby={
                validationErrors.email
                  ? "register-email-error"
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
              onChange={(event) => {
                setEmail(event.target.value);
                clearValidationError("email");
              }}
              placeholder="john@example.com"
              required
              type="email"
              value={email}
            />

            {validationErrors.email && (
              <p
                className="mt-1 text-sm text-error"
                id="register-email-error"
              >
                {validationErrors.email}
              </p>
            )}
          </div>

          <div className="form-control w-full">
            <label className="label" htmlFor="password">
              <span className="label-text font-medium text-slate-700">
                Password
              </span>
            </label>

            <input
              aria-describedby={
                validationErrors.password
                  ? "register-password-error"
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
              onChange={(event) => {
                setPassword(event.target.value);
                clearValidationError("password");
              }}
              placeholder="••••••••"
              required
              type="password"
              value={password}
            />

            {validationErrors.password && (
              <p
                className="mt-1 text-sm text-error"
                id="register-password-error"
              >
                {validationErrors.password}
              </p>
            )}
          </div>

          <div className="form-control w-full">
            <label
              className="label"
              htmlFor="department"
            >
              <span className="label-text font-medium text-slate-700">
                Department
              </span>
            </label>

            <select
              aria-describedby={
                validationErrors.departmentId
                  ? "department-error"
                  : undefined
              }
              aria-invalid={Boolean(
                validationErrors.departmentId,
              )}
              className={`select select-bordered w-full bg-white text-sm text-slate-900 focus:select-primary ${
                validationErrors.departmentId
                  ? "select-error"
                  : ""
              }`}
              id="department"
              onChange={(event) => {
                setDepartmentId(event.target.value);
                clearValidationError("departmentId");
              }}
              value={departmentId}
            >
              {departments.map((department) => (
                <option
                  key={department.id}
                  value={department.id}
                >
                  {department.name}
                </option>
              ))}
            </select>

            {validationErrors.departmentId && (
              <p
                className="mt-1 text-sm text-error"
                id="department-error"
              >
                {validationErrors.departmentId}
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
                ? "Creating Account..."
                : "Register"}
            </Button>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}