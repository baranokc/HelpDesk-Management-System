interface BadgeProps {
  children: React.ReactNode;
  tone?: "slate" | "blue" | "green" | "amber" | "red" | "purple";
}

const tones = {
  slate: "badge-ghost",
  blue: "badge-info",
  green: "badge-success",
  amber: "badge-warning",
  red: "badge-error",
  purple: "badge-secondary",
};

export function Badge({ children, tone = "slate" }: BadgeProps) {
  return (
    <span
      className={`badge ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
