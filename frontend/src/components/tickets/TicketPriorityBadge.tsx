interface TicketPriorityBadgeProps {
  priority: string;
}

const priorityBadgeSize = [
  "badge",
  "h-7 w-28",
  "shrink-0 justify-center",
  "whitespace-nowrap",
  "border",
  "text-center text-xs font-semibold",
].join(" ");

function getPriorityClass(priorityName: string): string {
  const priority = priorityName
    .trim()
    .toLocaleLowerCase("tr-TR");

  if (
    priority.includes("critical") ||
    priority.includes("kritik")
  ) {
    return "border-red-900 bg-red-800 text-white";
  }

  if (
    priority.includes("high") ||
    priority.includes("yüksek")
  ) {
    return "border-red-300 bg-red-200 text-red-900";
  }

  if (
    priority.includes("medium") ||
    priority.includes("orta")
  ) {
    return "border-orange-300 bg-orange-200 text-orange-900";
  }

  if (
    priority.includes("low") ||
    priority.includes("düşük")
  ) {
    return "border-green-300 bg-green-200 text-green-900";
  }

  return "border-slate-300 bg-slate-100 text-slate-700";
}

export function TicketPriorityBadge({
  priority,
}: TicketPriorityBadgeProps) {
  return (
    <span
      className={`${priorityBadgeSize} ${getPriorityClass(
        priority,
      )}`}
    >
      {priority}
    </span>
  );
}