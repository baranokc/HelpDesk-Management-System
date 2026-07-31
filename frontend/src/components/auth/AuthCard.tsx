import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="card w-full max-w-md border border-slate-200 bg-white shadow-lg">
        <div className="card-body">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">
              {title}
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              {description}
            </p>
          </div>

          {children}

          {footer && (
            <div className="mt-4 text-center text-sm">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
