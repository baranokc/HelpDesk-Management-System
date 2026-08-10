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

  const isCritical = p.includes("critical") || p.includes("kritik") || p.includes("urgent");
  const isHigh = p.includes("high") || p.includes("yüksek");
  const isMedium = p.includes("medium") || p.includes("orta");
  const isLow = p.includes("low") || p.includes("düşük");

  // Projenin renk paletine ve modlarına uygun stiller
  let badgeStyle =
    "bg-stone-100 text-stone-700 border-stone-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  let dotStyle = "bg-stone-400 dark:bg-slate-500";

  if (isCritical) {
    badgeStyle =
      "bg-rose-500/15 text-rose-800 border-rose-600/40 animate-pulse shadow-sm dark:bg-rose-500/25 dark:text-rose-200 dark:border-rose-400/80 dark:shadow-[0_0_15px_rgba(244,63,94,0.45)] font-black";
    dotStyle = "bg-rose-600 dark:bg-rose-400";
  } else if (isHigh) {
    badgeStyle =
      "bg-amber-500/15 text-amber-800 border-amber-600/30 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/60 font-bold";
    dotStyle = "bg-amber-600 dark:bg-amber-400";
  } else if (isMedium) {
    badgeStyle =
      "bg-teal-500/15 text-teal-800 border-teal-600/30 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40 font-bold";
    dotStyle = "bg-teal-600 dark:text-blue-400";
  } else if (isLow) {
    badgeStyle =
      "bg-emerald-500/15 text-emerald-800 border-emerald-600/30 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-600/50 font-semibold";
    dotStyle = "bg-emerald-600 dark:bg-slate-400";
  }

  const urgencyColorClass = getUrgencyTextColor(urgency);

  return (
    <div className="relative group/tooltip inline-flex items-center justify-center">
      <span
        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl text-xs border ${badgeStyle} w-28 shrink-0 cursor-help transition-all text-center shadow-sm`}
      >
        {/* Durum Noktası ve Critical İçin Ping Efekti */}
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

      {/* Mouse Üzerine Geldiğinde (Hover) Görünen Tooltip */}
      {urgency && (
        <div className="absolute bottom-full mb-2 hidden group-hover/tooltip:flex flex-col items-center pointer-events-none z-30 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-stone-900 text-stone-100 dark:bg-slate-900 dark:text-slate-200 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-stone-700/80 dark:border-purple-900/40 shadow-2xl flex items-center gap-1.5 backdrop-blur-xl">
            <span className="text-stone-400 dark:text-slate-400 font-medium">Urgency:</span>
            <span className={`font-black ${urgencyColorClass}`}>{urgency}</span>
          </div>
          {/* Tooltip Ok İşareti */}
          <div className="w-2 h-2 bg-stone-900 dark:bg-slate-900 border-r border-b border-stone-700/80 dark:border-purple-900/40 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}