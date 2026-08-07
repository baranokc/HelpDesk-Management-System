"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const isFirstPage = page <= 1;
  const isLastPage = page >= (totalPages || 1);

  return (
    <div className="flex items-center gap-2">
      {/* PREVIOUS BUTTON */}
      <button
        type="button"
        disabled={isFirstPage}
        onClick={() => onChange(page - 1)}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold
                   text-slate-700 dark:text-slate-300
                   bg-white/80 dark:bg-slate-900/80
                   border border-slate-200 dark:border-slate-800/80
                   hover:bg-slate-100 dark:hover:bg-slate-800/80
                   hover:text-indigo-600 dark:hover:text-indigo-400
                   hover:border-indigo-500/30 dark:hover:border-indigo-500/30
                   disabled:opacity-40 disabled:pointer-events-none
                   transition-all shadow-sm active:scale-95"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        <span>Previous</span>
      </button>

      {/* PAGE INDICATOR BADGE */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs font-medium text-slate-600 dark:text-slate-400">
        <span>Page</span>
        <span className="font-mono font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-[11px] min-w-[24px] text-center shadow-inner">
          {page}
        </span>
        <span>of</span>
        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
          {totalPages || 1}
        </span>
      </div>

      {/* NEXT BUTTON */}
      <button
        type="button"
        disabled={isLastPage}
        onClick={() => onChange(page + 1)}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold
                   text-slate-700 dark:text-slate-300
                   bg-white/80 dark:bg-slate-900/80
                   border border-slate-200 dark:border-slate-800/80
                   hover:bg-slate-100 dark:hover:bg-slate-800/80
                   hover:text-indigo-600 dark:hover:text-indigo-400
                   hover:border-indigo-500/30 dark:hover:border-indigo-500/30
                   disabled:opacity-40 disabled:pointer-events-none
                   transition-all shadow-sm active:scale-95"
      >
        <span>Next</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}