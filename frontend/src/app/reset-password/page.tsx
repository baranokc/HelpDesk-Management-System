import { Suspense } from "react";
import { ResetPasswordForm } from "@/src/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
          <span className="loading loading-spinner loading-lg" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
