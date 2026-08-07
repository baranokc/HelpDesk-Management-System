interface TicketPriorityBadgeProps {
  priority: string;
  urgency?: string;
}

function getUrgencyTextColor(urgencyName?: string): string {
  if (!urgencyName) return "text-amber-600 dark:text-amber-400";
  const u = urgencyName.trim().toLowerCase();

  if (
    u.includes("critical") ||
    u.includes("kritik") ||
    u.includes("high") ||
    u.includes("yüksek") ||
    u.includes("urgent")
  ) {
    return "text-rose-600 dark:text-rose-400";
  }

  if (
    u.includes("medium") ||
    u.includes("orta") ||
    u.includes("normal")
  ) {
    return "text-amber-600 dark:text-amber-400";
  }

  if (u.includes("low") || u.includes("düşük")) {
    return "text-emerald-600 dark:text-emerald-400";
  }

  return "text-amber-600 dark:text-amber-400";
}

export function TicketPriorityBadge({
  priority,
  urgency,
}: TicketPriorityBadgeProps) {
  const p = priority.trim().toLowerCase();

  const isCritical = p.includes("critical") || p.includes("kritik");
  const isHigh = p.includes("high") || p.includes("yüksek");
  const isMedium = p.includes("medium") || p.includes("orta");
  const isLow = p.includes("low") || p.includes("düşük");

  // Light Mode ve Dark Mode ayrımlı sınıflar
  let badgeStyle =
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-700/50";
  let dotStyle = "bg-slate-400 dark:bg-slate-500";

  if (isCritical) {
    badgeStyle =
      "bg-rose-100 text-rose-800 border-rose-300 shadow-sm shadow-rose-200/50 animate-pulse dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-500/60 dark:shadow-[0_0_12px_rgba(244,63,94,0.4)]";
    dotStyle = "bg-rose-600 dark:bg-rose-500";
  } else if (isHigh) {
    badgeStyle =
      "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20";
    dotStyle = "bg-rose-500 dark:bg-rose-400";
  } else if (isMedium) {
    badgeStyle =
      "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20";
    dotStyle = "bg-amber-500 dark:bg-amber-400";
  } else if (isLow) {
    badgeStyle =
      "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20";
    dotStyle = "bg-emerald-500 dark:bg-emerald-400";
  }

  const urgencyColorClass = getUrgencyTextColor(urgency);

  return (
    <div className="relative group/tooltip inline-flex items-center justify-center">
      <span
        className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle} w-28 shrink-0 cursor-help transition-all text-center`}
      >
        {/* Hepsine eklenen renkli durum noktaları */}
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {isCritical && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotStyle}`}
          />
        </span>

        <span className="truncate">{priority}</span>
      </span>

      {/* Light & Dark Uyumlu Tooltip */}
      {urgency && (
        <div className="absolute bottom-full mb-2 hidden group-hover/tooltip:flex flex-col items-center pointer-events-none z-30 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-slate-900 text-slate-100 dark:bg-slate-800 dark:text-slate-200 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-700/80 shadow-xl flex items-center gap-1.5 backdrop-blur-md">
            <span className="text-slate-400">Urgency:</span>
            <span className={`font-bold ${urgencyColorClass}`}>{urgency}</span>
          </div>
          <div className="w-2 h-2 bg-slate-900 dark:bg-slate-800 border-r border-b border-slate-700/80 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}