"use client";

import Link from "next/link";
import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Building2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import {
  type FormErrors,
  getFormErrors,
} from "@/src/lib/validation";
import { registerSchema } from "@/src/schemas/authSchemas";
import { authService } from "@/src/services/authService";

const departments = [
  { id: "1", name: "Software" },
  { id: "2", name: "Human Resources" },
  { id: "3", name: "Information Technologies (IT)" },
  { id: "4", name: "Customer Services" },
];

export function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<FormErrors>({});

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
    <div className="relative flex min-h-screen items-center justify-center bg-amber-50/30 dark:bg-slate-950 px-4 py-12 transition-colors overflow-hidden">
      
      {/* Glow Arka Plan Efektleri */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-500/10 dark:bg-purple-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-teal-500/10 dark:bg-indigo-600/15 blur-3xl pointer-events-none" />

      {/* Sağ Üst Köşe Theme Toggle Button */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      {/* Kayıt Kartı */}
      <div className="relative w-full max-w-lg rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 shadow-2xl transition-all">
        
        {/* LOGO & BAŞLIK */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 via-teal-600 to-emerald-600 dark:from-purple-600 dark:via-violet-600 dark:to-indigo-500 text-white shadow-xl shadow-teal-600/20 dark:shadow-purple-500/25 mb-1 group hover:scale-105 transition-transform">
            <svg
              className="h-8 w-8 text-white drop-shadow-md"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="6" r="2.5" fill="currentColor" stroke="none" opacity="0.9" />
              <path d="M2 20c4-2 9-2 13 0" strokeWidth="2" />
              <path d="M11 20c0-4 1.5-7 4-10" strokeWidth="2" />
              <path d="M15 10c-3-2-6-1-7 1" />
              <path d="M15 10c2-3 4-3 6-1" />
              <path d="M15 10c0-3 2-5 4-5" />
              <path d="M15 10c-2-3-4-3-5-5" />
            </svg>
          </div>

          <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-800 via-emerald-800 to-teal-900 dark:from-purple-300 dark:via-violet-200 dark:to-indigo-200 bg-clip-text text-transparent">
            Create Archipelago Account
          </h2>

          <p className="text-xs font-medium text-stone-500 dark:text-slate-400">
            Enter your details to join the Helpdesk system
          </p>
        </div>

        {/* Hata Mesajı */}
        {error && (
          <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-800 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form
          className="mt-6 space-y-4"
          noValidate
          onSubmit={handleSubmit}
        >
          {/* FIRST & LAST NAME GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* FIRST NAME */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-slate-300" htmlFor="name">
                <User className="h-3.5 w-3.5 text-emerald-600 dark:text-purple-400" />
                <span>First Name</span>
              </label>

              <input
                id="name"
                type="text"
                required
                value={name}
                placeholder="John"
                onChange={(event) => {
                  setName(event.target.value);
                  clearValidationError("name");
                }}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-all outline-none bg-stone-50/60 dark:bg-slate-950/60 text-stone-800 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 ${
                  validationErrors.name
                    ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-stone-300/80 dark:border-purple-800/40 focus:border-emerald-600 dark:focus:border-purple-500 focus:ring-2 focus:ring-emerald-600/20 dark:focus:ring-purple-500/20"
                }`}
              />

              {validationErrors.name && (
                <p className="text-[11px] font-semibold text-rose-500">
                  {validationErrors.name}
                </p>
              )}
            </div>

            {/* LAST NAME */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-slate-300" htmlFor="lastName">
                <User className="h-3.5 w-3.5 text-emerald-600 dark:text-purple-400" />
                <span>Last Name</span>
              </label>

              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                placeholder="Doe"
                onChange={(event) => {
                  setLastName(event.target.value);
                  clearValidationError("lastName");
                }}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-all outline-none bg-stone-50/60 dark:bg-slate-950/60 text-stone-800 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 ${
                  validationErrors.lastName
                    ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-stone-300/80 dark:border-purple-800/40 focus:border-emerald-600 dark:focus:border-purple-500 focus:ring-2 focus:ring-emerald-600/20 dark:focus:ring-purple-500/20"
                }`}
              />

              {validationErrors.lastName && (
                <p className="text-[11px] font-semibold text-rose-500">
                  {validationErrors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* EMAIL */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-slate-300" htmlFor="email">
              <Mail className="h-3.5 w-3.5 text-emerald-600 dark:text-purple-400" />
              <span>Email Address</span>
            </label>

            <input
              id="email"
              type="email"
              required
              value={email}
              placeholder="john@example.com"
              onChange={(event) => {
                setEmail(event.target.value);
                clearValidationError("email");
              }}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-all outline-none bg-stone-50/60 dark:bg-slate-950/60 text-stone-800 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 ${
                validationErrors.email
                  ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  : "border-stone-300/80 dark:border-purple-800/40 focus:border-emerald-600 dark:focus:border-purple-500 focus:ring-2 focus:ring-emerald-600/20 dark:focus:ring-purple-500/20"
              }`}
            />

            {validationErrors.email && (
              <p className="text-[11px] font-semibold text-rose-500">
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* PASSWORD */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-slate-300" htmlFor="password">
              <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-purple-400" />
              <span>Password</span>
            </label>

            <input
              id="password"
              type="password"
              required
              value={password}
              placeholder="••••••••"
              onChange={(event) => {
                setPassword(event.target.value);
                clearValidationError("password");
              }}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-all outline-none bg-stone-50/60 dark:bg-slate-950/60 text-stone-800 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 ${
                validationErrors.password
                  ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  : "border-stone-300/80 dark:border-purple-800/40 focus:border-emerald-600 dark:focus:border-purple-500 focus:ring-2 focus:ring-emerald-600/20 dark:focus:ring-purple-500/20"
              }`}
            />

            {validationErrors.password && (
              <p className="text-[11px] font-semibold text-rose-500">
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* DEPARTMENT SELECT */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-slate-300" htmlFor="department">
              <Building2 className="h-3.5 w-3.5 text-emerald-600 dark:text-purple-400" />
              <span>Department</span>
            </label>

            <div className="relative">
              <select
                id="department"
                value={departmentId}
                onChange={(event) => {
                  setDepartmentId(event.target.value);
                  clearValidationError("departmentId");
                }}
                className={`w-full appearance-none rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-all outline-none bg-stone-50/60 dark:bg-slate-950/60 text-stone-800 dark:text-slate-100 ${
                  validationErrors.departmentId
                    ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-stone-300/80 dark:border-purple-800/40 focus:border-emerald-600 dark:focus:border-purple-500 focus:ring-2 focus:ring-emerald-600/20 dark:focus:ring-purple-500/20"
                }`}
              >
                {departments.map((department) => (
                  <option
                    key={department.id}
                    value={department.id}
                    className="bg-white dark:bg-slate-900 text-stone-800 dark:text-slate-100"
                  >
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            {validationErrors.departmentId && (
              <p className="text-[11px] font-semibold text-rose-500">
                {validationErrors.departmentId}
              </p>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <Button
              type="submit"
              loading={loading}
              className="w-full !inline-flex !items-center !justify-center !gap-2 !py-2.5 !rounded-xl !text-xs !font-bold !text-white !bg-gradient-to-r !from-emerald-600 !to-teal-700 dark:!from-purple-600 dark:!to-indigo-600 hover:!from-emerald-500 hover:!to-teal-600 dark:hover:!from-purple-500 dark:hover:!to-indigo-500 shadow-lg shadow-emerald-700/20 dark:shadow-purple-600/25 active:scale-[0.98] transition-all"
            >
              <span>{loading ? "Creating Account..." : "Register"}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </form>

        {/* SIGN IN LINK */}
        <div className="mt-6 text-center text-xs font-medium">
          <span className="text-stone-500 dark:text-slate-400">
            Already have an account?{" "}
          </span>

          <Link
            href="/login"
            className="font-bold text-emerald-700 hover:text-emerald-800 dark:text-purple-400 dark:hover:text-purple-300 hover:underline transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}