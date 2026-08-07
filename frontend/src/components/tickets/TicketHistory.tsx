"use client";

import {
  ArrowRight,
  Activity,
  CheckCircle2,
  RefreshCw,
  UserPlus,
  Clock,
  Cpu,
} from "lucide-react";
import type { TicketHistoryDto } from "@/src/types/ticket-status";
import { Avatar } from "@/src/components/ui/Avatar";
import { EmptyState } from "@/src/components/ui/EmptyState";

function getHistoryActionBadge(actionType?: string | number, fieldName?: string | null) {
  const field = fieldName?.toLowerCase() || "";
  const typeStr = String(actionType).toLowerCase();

  if (field.includes("status") || typeStr.includes("status")) {
    return {
      icon: RefreshCw,
      colorClass: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/30",
      dotClass: "bg-amber-500",
    };
  }

  if (field.includes("assign") || typeStr.includes("assign")) {
    return {
      icon: UserPlus,
      colorClass: "bg-teal-500/10 text-teal-800 dark:bg-indigo-500/20 dark:text-indigo-300 border-teal-500/30 dark:border-indigo-500/30",
      dotClass: "bg-teal-500 dark:bg-indigo-500",
    };
  }

  if (field.includes("resolve") || typeStr.includes("resolve") || field.includes("close")) {
    return {
      icon: CheckCircle2,
      colorClass: "bg-emerald-500/10 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/30",
      dotClass: "bg-emerald-500",
    };
  }

  return {
    icon: Activity,
    colorClass: "bg-emerald-500/10 text-emerald-800 dark:bg-purple-500/20 dark:text-purple-300 border-emerald-500/30 dark:border-purple-500/30",
    dotClass: "bg-emerald-600 dark:bg-purple-500",
  };
}

export function TicketHistory({
  history,
}: {
  history: TicketHistoryDto[];
}) {
  if (history.length === 0) {
    return (
      <EmptyState
        description="There are no history records logged for this ticket yet."
        title="No history record"
      />
    );
  }

  return (
    <div className="relative pl-6 space-y-4 py-2 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200 dark:before:bg-purple-900/30">
      {history.map((item, index) => {
        const formattedDate = new Intl.DateTimeFormat("tr-TR", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(item.changedAt));

        const titleText =
          item.description || item.fieldName || String(item.actionType);

        const badgeStyle = getHistoryActionBadge(item.actionType, item.fieldName);
        const IconComponent = badgeStyle.icon;

        const isSystem = item.changedByName?.toLowerCase().trim() === "system";
        const displayName = item.changedByName || "User";

        return (
          <div
            key={item.id}
            className="relative group animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: `${(index % 8) * 40}ms` }}
          >
            {/* SOL AKIŞ NOKTASI (ÇUBUK ÜZERİNDEKİ SADE HALKA) */}
            <div className="absolute -left-[19px] top-3.5 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-slate-900 border-2 border-stone-300 dark:border-purple-800 group-hover:border-emerald-600 dark:group-hover:border-purple-400 group-hover:scale-125 transition-all z-10">
              <span className={`h-1.5 w-1.5 rounded-full ${badgeStyle.dotClass}`} />
            </div>

            {/* HİSTORY KARTI */}
            <div className="relative rounded-2xl border border-stone-200/80 dark:border-purple-900/40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4 shadow-sm hover:border-emerald-600/30 dark:hover:border-purple-500/40 transition-all">
              
              {/* ÜST BAŞLIK VE TARİH */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-stone-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-1.2 rounded-lg border ${badgeStyle.colorClass} shrink-0`}>
                    <IconComponent className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-bold text-stone-800 dark:text-slate-100 truncate">
                    {titleText}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-stone-400 dark:text-slate-400 shrink-0">
                  <Clock className="h-3 w-3" />
                  <span>{formattedDate}</span>
                </div>
              </div>

              {/* DETAY VE KULLANICI / DEĞİŞİM ROZETİ */}
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
                
                {/* YAPAN KİŞİ */}
                <div className="flex items-center gap-2 text-stone-600 dark:text-slate-300 text-[11px]">
                  {isSystem ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 border border-stone-200 dark:border-slate-700 shrink-0">
                      <Cpu className="h-3 w-3" />
                    </div>
                  ) : (
                    <Avatar
                      name={displayName}
                      size="xs"
                      className="h-5 w-5 text-[9px] border border-stone-300 dark:border-slate-700 shrink-0"
                    />
                  )}

                  <span>
                    Changed by{" "}
                    <strong className="text-stone-900 dark:text-white font-bold">
                      {isSystem ? "System" : displayName}
                    </strong>
                  </span>
                </div>

                {/* DEĞİŞİM (OLD -> NEW) */}
                {item.oldValue != null && item.newValue != null && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-stone-100/90 dark:bg-slate-800/90 border border-stone-200/80 dark:border-slate-700/80 text-[11px] font-mono">
                    <span className="text-stone-400 dark:text-slate-400 line-through decoration-rose-500/50">
                      {item.oldValue}
                    </span>
                    <ArrowRight className="h-3 w-3 text-emerald-600 dark:text-purple-400 shrink-0" />
                    <span className="font-bold text-emerald-800 dark:text-purple-300">
                      {item.newValue}
                    </span>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}