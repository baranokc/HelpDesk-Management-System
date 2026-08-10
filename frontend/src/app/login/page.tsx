import { Suspense } from "react";
import { LoginForm } from "@/src/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-sky-50/70 dark:bg-slate-950 transition-colors">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 dark:border-purple-500 border-t-transparent" />
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
              Loading...
            </span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
