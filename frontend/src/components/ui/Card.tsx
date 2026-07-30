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
      className={`card border border-base-300 bg-base-100 shadow-sm ${className}`}
      {...props}
    >
      {(title || description || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-base-300 px-6 py-4">
          <div>
            {title && <h2 className="card-title text-base">{title}</h2>}
            {description && (
              <p className="mt-1 text-sm opacity-60">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className="card-body p-6">{children}</div>
    </section>
  );
}
