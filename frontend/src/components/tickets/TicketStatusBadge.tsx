interface TicketStatusBadgeProps {
  status: string;
}

const statusBadgeSize = [
  "badge",
  "h-7 w-28",
  "shrink-0 justify-center",
  "whitespace-nowrap",
  "border",
  "text-center text-xs font-semibold",
].join(" ");

function getStatusClass(statusName: string): string {
  const status = statusName
    .trim()
    .toLocaleLowerCase("tr-TR");

  if (
    status.includes("open") ||
    status.includes("açık")
  ) {
    return "border-sky-300 bg-sky-100 text-sky-900";
  }

  if (
    status.includes("progress") ||
    status.includes("devam")
  ) {
    return "border-amber-300 bg-amber-100 text-amber-900";
  }

  if (
    status.includes("resolved") ||
    status.includes("çözüldü")
  ) {
    return "border-emerald-300 bg-emerald-100 text-emerald-900";
  }

  if (
    status.includes("closed") ||
    status.includes("kapatıldı")
  ) {
    return "border-slate-400 bg-slate-200 text-slate-900";
  }

  return "border-slate-300 bg-slate-100 text-slate-700";
}

export function TicketStatusBadge({
  status,
}: TicketStatusBadgeProps) {
  return (
    <span
      className={`${statusBadgeSize} ${getStatusClass(
        status,
      )}`}
    >
      {status}
    </span>
  );
}