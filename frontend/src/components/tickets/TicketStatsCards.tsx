"use client";

interface TicketStatsCardsProps {
  totalCount?: number;
  openCount?: number;
  inProgressCount?: number;
  completedCount?: number;
  loading?: boolean;
}

export function TicketStatsCards({
  totalCount = 0,
  openCount = 0,
  inProgressCount = 0,
  completedCount = 0,
  loading = false,
}: TicketStatsCardsProps) {
  const stats = [
    {
      title: "Total Tickets",
      value: totalCount,
      description: "All tickets in system",
      icon: (
        <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
      bgIcon: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/50",
    },
    {
      title: "Open / New",
      value: openCount,
      description: "Awaiting action",
      icon: (
        <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgIcon: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/50",
    },
    {
      title: "In Progress",
      value: inProgressCount,
      description: "Active, On Hold & Waiting",
      icon: (
        <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      bgIcon: "bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-900/50",
    },
    {
      title: "Completed",
      value: completedCount,
      description: "Resolved, Closed & Cancelled",
      icon: (
        <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgIcon: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:hover:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {stat.title}
            </span>
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${stat.bgIcon}`}>
              {stat.icon}
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            {loading ? (
              <div className="skeleton h-8 w-16 bg-slate-200 dark:bg-slate-800" />
            ) : (
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {stat.value}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {stat.description}
          </p>
        </div>
      ))}
    </div>
  );
}