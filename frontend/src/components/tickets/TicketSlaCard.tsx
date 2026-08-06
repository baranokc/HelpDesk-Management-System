import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import type { TicketSlaStatus, TicketSlaSummaryDto } from "@/src/types/ticket";

const statusTone: Record<TicketSlaStatus, "amber" | "green" | "red"> = {
  Pending: "amber",
  Met: "green",
  Breached: "red",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {title}
        </h3>
        <Badge tone={statusTone[status]}>{status}</Badge>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isPaused ? "Frozen due at" : "Due at"}
          </dt>
          <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
            {formatDate(dueAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Completed at
          </dt>
          <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
            {completedAt ? formatDate(completedAt) : "Not completed yet"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function TicketSlaCard({ sla }: { sla: TicketSlaSummaryDto }) {
  return (
    <Card
      action={sla.isPaused ? <Badge tone="blue">Paused</Badge> : undefined}
      className="border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900"
      description={`${sla.calendarName} · ${sla.timeZoneId} working time`}
      title="SLA status"
    >
      <div className="space-y-4">
        <SlaTarget
          completedAt={sla.firstResponseAt}
          dueAt={sla.firstResponseDueAt}
          isPaused={sla.isPaused}
          status={sla.firstResponseStatus}
          title="First response"
        />
        <SlaTarget
          completedAt={sla.resolutionAt}
          dueAt={sla.resolutionDueAt}
          isPaused={sla.isPaused}
          status={sla.resolutionStatus}
          title="Resolution"
        />
      </div>
    </Card>
  );
}
