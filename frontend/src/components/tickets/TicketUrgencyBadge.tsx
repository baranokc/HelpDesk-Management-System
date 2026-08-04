interface TicketUrgencyBadgeProps {
  urgency: string;
}

const urgencyBadgeSize = [
  "badge",
  "h-7 w-28",
  "shrink-0 justify-center",
  "whitespace-nowrap",
  "border",
  "text-center text-xs font-semibold",
].join(" ");

function getUrgencyClass(urgencyName: string): string {
  const urgency = urgencyName.trim().toLocaleLowerCase("tr-TR");

  if (urgency.includes("critical") || urgency.includes("kritik")) {
    return "border-red-900 bg-red-800 text-white";
  }

  if (urgency.includes("high") || urgency.includes("yüksek")) {
    return "border-red-300 bg-red-200 text-red-900";
  }

  if (
    urgency.includes("normal") ||
    urgency.includes("medium") ||
    urgency.includes("orta")
  ) {
    return "border-orange-300 bg-orange-200 text-orange-900";
  }

  if (urgency.includes("low") || urgency.includes("düşük")) {
    return "border-green-300 bg-green-200 text-green-900";
  }

  return "border-slate-300 bg-slate-100 text-slate-700";
}

export function TicketUrgencyBadge({
  urgency,
}: TicketUrgencyBadgeProps) {
  return (
    <span className={`${urgencyBadgeSize} ${getUrgencyClass(urgency)}`}>
      {urgency}
    </span>
  );
}
