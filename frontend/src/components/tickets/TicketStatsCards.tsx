"use client";

interface TicketStatsCardsProps {
  totalCount?: number;
  openCount?: number;
  inProgressCount?: number;
  completedCount?: number;
  loading?: boolean;
  totalDescription?: string;
  showCsat?: boolean;
  csatAverage?: number;
  csatSurveyCount?: number;
}

export function TicketStatsCards({
  totalCount = 0,
  openCount = 0,
  inProgressCount = 0,
  completedCount = 0,
  loading = false,
  totalDescription = "All tickets in this view",
  showCsat = false,
  csatAverage = 0,
  csatSurveyCount = 0,
}: TicketStatsCardsProps) {
  const stats = [
    {
      title: "Total Tickets",
      value: totalCount,
      valueSuffix: undefined,
      description: totalDescription,
      icon: (
        <svg
          className="h-5 w-5 text-blue-600 dark:text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
          />
        </svg>
      ),
      bgIcon:
        "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/50",
    },
    {
      title: "Open / New",
      value: openCount,
      valueSuffix: undefined,
      description: "Awaiting action",
      icon: (
        <svg
          className="h-5 w-5 text-amber-600 dark:text-amber-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgIcon:
        "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/50",
    },
    {
      title: "In Progress",
      value: inProgressCount,
      valueSuffix: undefined,
      description: "Active, On Hold & Waiting",
      icon: (
        <svg
          className="h-5 w-5 text-purple-600 dark:text-purple-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      bgIcon:
        "bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-900/50",
    },
    {
      title: "Completed",
      value: completedCount,
      valueSuffix: undefined,
      description: "Resolved, Closed & Cancelled",
      icon: (
        <svg
          className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgIcon:
        "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/50",
    },
    ...(showCsat
      ? [
          {
            title: "Average CSAT",
            value: csatSurveyCount > 0 ? csatAverage.toFixed(1) : "—",
            valueSuffix: csatSurveyCount > 0 ? "/ 5" : undefined,
            description: `${csatSurveyCount} ${
              csatSurveyCount === 1 ? "survey" : "surveys"
            } received`,
            icon: (
              <svg
                className="h-5 w-5 fill-amber-500 text-amber-500"
                fill="currentColor"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="m12 2.75 2.78 5.63 6.22.91-4.5 4.38 1.06 6.19L12 16.94l-5.56 2.92 1.06-6.19L3 9.29l6.22-.91L12 2.75Z"
                />
              </svg>
            ),
            bgIcon:
              "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/50",
          },
        ]
      : []),
  ];

  return (
    <div
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
        showCsat ? "lg:grid-cols-5" : "lg:grid-cols-4"
      }`}
    >
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:hover:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {stat.title}
            </span>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg border ${stat.bgIcon}`}
            >
              {stat.icon}
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            {loading ? (
              <div className="skeleton h-8 w-16 bg-slate-200 dark:bg-slate-800" />
            ) : (
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {stat.value}
                {stat.valueSuffix && (
                  <span className="ml-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {stat.valueSuffix}
                  </span>
                )}
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
