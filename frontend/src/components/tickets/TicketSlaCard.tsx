import type { TicketSlaStatus, TicketSlaSummaryDto } from "@/src/types/ticket";
import { Clock, PauseCircle, CheckCircle2, AlertTriangle } from "lucide-react";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

// 🌟 Simetrik ve Şık Durum Rozeti
function SlaStatusBadge({ status }: { status: TicketSlaStatus }) {
  switch (status) {
    case "Met":
      return (
        <span className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-600/30 dark:border-emerald-500/40 text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          Met
        </span>
      );
    case "Breached":
      return (
        <span className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/15 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-600/30 dark:border-rose-500/40 text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
          <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
          Breached
        </span>
      );
    case "Pending":
    default:
      return (
        <span className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-600/30 dark:border-amber-500/40 text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
          <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          Pending
        </span>
      );
  }
}

function SlaTarget({
  title,
  dueAt,
  completedAt,
  status,
  isPaused,
}: {
  title: string;
  dueAt: string;
  completedAt?: string | null;
  status: TicketSlaStatus;
  isPaused: boolean;
}) {
  return (
    <div className="rounded-2xl border border-stone-200/80 bg-stone-50/80 p-4 transition-all dark:border-slate-700/80 dark:bg-slate-800/60 shadow-inner space-y-3">
      {/* Üst Kısım: Başlık (text-[11px] ile sığmama sorunu çözüldü) ve Rozet */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-purple-500/20 text-emerald-700 dark:text-purple-300 border border-emerald-600/20 dark:border-purple-500/30">
            <Clock className="h-4 w-4" />
          </div>
          <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-stone-800 dark:text-slate-200">
            {title}
          </h3>
        </div>
        <SlaStatusBadge status={status} />
      </div>

      {/* Alt Kısım: Tarih Kutuları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="bg-white/90 dark:bg-slate-900/70 p-3.5 rounded-xl border border-stone-200/80 dark:border-slate-700/80 shadow-sm">
          <p className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-stone-400 dark:text-slate-400">
            {isPaused ? "Frozen due at" : "Due at"}
          </p>
          <p className="mt-1 font-bold text-stone-900 dark:text-slate-100 break-words">
            {formatDate(dueAt)}
          </p>
        </div>
        <div className="bg-white/90 dark:bg-slate-900/70 p-3.5 rounded-xl border border-stone-200/80 dark:border-slate-700/80 shadow-sm">
          <p className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-stone-400 dark:text-slate-400">
            Completed at
          </p>
          <p className="mt-1 font-bold text-stone-900 dark:text-slate-100 break-words">
            {completedAt ? formatDate(completedAt) : "Not completed yet"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TicketSlaCard({ sla }: { sla: TicketSlaSummaryDto }) {
  return (
    <div className="rounded-3xl border border-stone-200/80 bg-white/80 p-6 shadow-xl backdrop-blur-2xl transition-colors dark:border-purple-900/40 dark:bg-slate-900/80 space-y-5">
      {/* 🌟 Yeni, Temiz ve Modern Başlık Alanı */}
      <div className="flex items-center justify-between gap-4 border-b border-stone-200/80 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-black tracking-tight text-stone-900 dark:text-white">
            SLA Status
          </h2>
          <p className="mt-0.5 text-xs font-medium text-stone-500 dark:text-slate-400">
            {sla.calendarName} · {sla.timeZoneId} working time
          </p>
        </div>

        {sla.isPaused && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 dark:bg-purple-500/20 text-amber-800 dark:text-purple-300 border border-amber-600/30 dark:border-purple-500/30 text-[10px] font-extrabold uppercase tracking-wider shadow-sm shrink-0">
            <PauseCircle className="h-3.5 w-3.5" /> Paused
          </span>
        )}
      </div>

      {/* SLA Hedefleri */}
      <div className="space-y-4">
        <SlaTarget
          completedAt={sla.firstResponseAt}
          dueAt={sla.firstResponseDueAt}
          isPaused={sla.isPaused}
          status={sla.firstResponseStatus}
          title="First Response"
        />
        <SlaTarget
          completedAt={sla.resolutionAt}
          dueAt={sla.resolutionDueAt}
          isPaused={sla.isPaused}
          status={sla.resolutionStatus}
          title="Resolution"
        />
      </div>
    </div>
  );
}