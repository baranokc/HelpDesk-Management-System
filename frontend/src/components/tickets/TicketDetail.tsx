import { Card } from "@/src/components/ui/Card";
import type { TicketDetailDto } from "@/src/types/ticket";
import { TicketPriorityBadge } from "./TicketPriorityBadge";
import { TicketStatusBadge } from "./TicketStatusBadge";

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex flex-col border-b border-base-200 py-3 last:border-0 dark:border-slate-700">
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
        {value || "—"}
      </dd>
    </div>
  );
}

export function TicketHeader({ ticket }: { ticket: TicketDetailDto }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-md bg-blue-50 px-2.5 py-1 text-sm font-bold tracking-wide text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          #{ticket.ticketNumber}
        </span>
        <TicketStatusBadge status={ticket.statusName} />
        <TicketPriorityBadge priority={ticket.priorityName} />
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {ticket.ticketTitle}
        </h1>
        {ticket.ticketDescription && (
          <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
            {ticket.ticketDescription}
          </p>
        )}
      </div>

      <div className="text-xs text-slate-400">
        {new Intl.DateTimeFormat("tr-TR", {
          dateStyle: "long",
          timeStyle: "short",
        }).format(new Date(ticket.createdAt))}
      </div>
    </div>
  );
}

export function TicketSubject({ ticket }: { ticket: TicketDetailDto }) {
  return (
    <Card className="shadow-sm" title="Detailed explanation">
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <p className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
          {ticket.subject}
        </p>
      </div>
    </Card>
  );
}

export function TicketMetadata({ ticket }: { ticket: TicketDetailDto }) {
  return (
    <Card className="shadow-sm" title="Ticket information">
      <dl className="flex flex-col">
        <DetailItem label="Created by" value={ticket.createdByName} />
        <DetailItem label="Assigned team" value={ticket.teamName} />
        <DetailItem label="Assigned to" value={ticket.assignedToName} />
        <DetailItem label="Category" value={ticket.categoryName} />
        <DetailItem label="Subcategory" value={ticket.subcategoryName} />
        <DetailItem label="Impact" value={ticket.impactLevelName} />
        <DetailItem label="Urgency" value={ticket.urgencyLevelName} />
        {ticket.resolvedAt && (
          <DetailItem
            label="Resolved at"
            value={new Date(ticket.resolvedAt).toLocaleString("tr-TR")}
          />
        )}
      </dl>
    </Card>
  );
}