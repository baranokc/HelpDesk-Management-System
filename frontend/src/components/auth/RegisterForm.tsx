"use client";

import Link from "next/link";
import {
  useState,
  type SubmitEvent,
} from "react";
import { useRouter } from "next/navigation";
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
  );
}
