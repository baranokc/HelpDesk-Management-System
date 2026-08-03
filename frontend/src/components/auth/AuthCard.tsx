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
    <div className="card w-full max-w-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl transition-colors">
      <div className="card-body">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            {title}
          </h2>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {description}
          </p>
        </div>

        {children}

        {footer && (
          <div className="mt-4 text-center text-sm border-t border-slate-100 dark:border-slate-800 pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}