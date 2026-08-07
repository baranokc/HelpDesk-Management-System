interface TicketPriorityBadgeProps {
  priority: string;
  urgency?: string;
}

export function TicketPriorityBadge({ priority, urgency }: TicketPriorityBadgeProps) {
  const p = priority.trim().toLowerCase();

  let style = "bg-slate-500/10 text-slate-400 border-slate-700/50";

  if (p.includes("critical") || p.includes("kritik")) {
    style = "bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-sm shadow-rose-950/50";
  } else if (p.includes("high") || p.includes("yüksek")) {
    style = "bg-rose-500/10 text-rose-300 border-rose-500/20";
  } else if (p.includes("medium") || p.includes("orta")) {
    style = "bg-amber-500/10 text-amber-300 border-amber-500/20";
  } else if (p.includes("low") || p.includes("düşük")) {
    style = "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
  }

  return (
    <div className="relative group/tooltip inline-flex items-center justify-center">
      <span
        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style} w-28 shrink-0 cursor-help transition-all text-center`}
      >
        <span className="truncate">{priority}</span>
      </span>

      {/* Mouse üzerine geldiğinde (Hover) görünen Tooltip */}
      {urgency && (
        <div className="absolute bottom-full mb-2 hidden group-hover/tooltip:flex flex-col items-center pointer-events-none z-30 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-slate-900/95 dark:bg-slate-800/95 text-slate-200 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-700/80 shadow-xl flex items-center gap-1.5 backdrop-blur-md">
            <span className="text-slate-400">Urgency:</span>
            <span className="font-bold text-amber-400">{urgency}</span>
          </div>
          {/* Tooltip Ok İşareti */}
          <div className="w-2 h-2 bg-slate-900/95 dark:bg-slate-800/95 border-r border-b border-slate-700/80 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}