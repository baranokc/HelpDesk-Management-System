interface TicketStatusBadgeProps {
  status: string;
}

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  const s = status.trim().toLowerCase();

  let style = {
    badge:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-700/50",
    dot: "bg-slate-500 dark:bg-slate-400",
  };

  if (s.includes("open") || s.includes("açık") || s.includes("new")) {
    style = {
      badge:
        "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
      dot: "bg-sky-500 dark:bg-sky-400",
    };
  } else if (s.includes("progress") || s.includes("devam")) {
    style = {
      badge:
        "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
      dot: "bg-amber-500 dark:bg-amber-400 animate-pulse",
    };
  } else if (s.includes("resolved") || s.includes("çözüldü")) {
    style = {
      badge:
        "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
      dot: "bg-emerald-500 dark:bg-emerald-400",
    };
  } else if (s.includes("closed") || s.includes("kapatıldı")) {
    style = {
      badge:
        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-700/40",
      dot: "bg-slate-400 dark:bg-slate-500",
    };
  } else if (s.includes("cancelled") || s.includes("iptal")) {
    style = {
      badge:
        "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
      dot: "bg-rose-500 dark:bg-rose-400",
    };
  } else if (s.includes("hold") || s.includes("beklemede")) {
    style = {
      badge:
        "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
      dot: "bg-purple-500 dark:bg-purple-400",
    };
  } else if (s.includes("waiting") || s.includes("user")) {
    style = {
      badge:
        "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
      dot: "bg-indigo-500 dark:bg-indigo-400 animate-pulse",
    };
  }

  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.badge} w-28 shrink-0 transition-all`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      <span className="truncate">{status}</span>
    </span>
  );
}