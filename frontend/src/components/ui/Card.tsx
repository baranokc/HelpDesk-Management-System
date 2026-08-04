import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function Card({
  title,
  description,
  action,
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <section
      className={`card rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm transition-colors ${className}`}
      {...props}
    >
      {(title || description || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div>
            {title && (
              <h2 className="card-title text-base font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="card-body p-6 text-slate-800 dark:text-slate-200">
        {children}
      </div>
    </section>
  );
}