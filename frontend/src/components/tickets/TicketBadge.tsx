import type { ReactNode } from "react";

interface TicketBadgeProps {
  children: ReactNode;
  className?: string;
}

export function TicketBadge({
  children,
  className = "",
}: TicketBadgeProps) {
  return (
    <span
      className={[
        "badge",
        "h-7 w-28",
        "justify-center",
        "whitespace-nowrap",
        "border",
        "text-center text-xs font-semibold",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}