import { TicketDetailDto } from "@/src/types/ticket";
import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { TicketStatusBadge } from "./TicketStatusBadge";

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">
        {value || "—"}
      </dd>
    </div>
  );
}

export function TicketDetail({ ticket }: { ticket: TicketDetailDto }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-blue-700">
              {ticket.ticketNumber}
            </span>
            <TicketStatusBadge status={ticket.statusName} />
            <Badge tone="purple">{ticket.priorityName}</Badge>
          </div>
          <h1 className="mt-2 text-2xl font-bold">
            {ticket.ticketTitle}
          </h1>
          <p className="mt-1 text-sm opacity-60">
            {ticket.ticketDescription}
          </p>
        </div>
        <p className="text-sm opacity-60">
          {new Intl.DateTimeFormat("tr-TR", {
            dateStyle: "long",
            timeStyle: "short",
          }).format(new Date(ticket.createdAt))}
        </p>
      </div>

      <Card title="Detailed explanation">
        <p className="whitespace-pre-wrap text-sm leading-7">
          {ticket.subject}
        </p>
      </Card>

      <Card title="Ticket information">
        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem label="Created by" value={ticket.createdByName} />
          <DetailItem label="Asigned to" value={ticket.teamName} />
          <DetailItem label="Asigned by" value={ticket.assignedToName} />
          <DetailItem label="Category" value={ticket.categoryName} />
          <DetailItem label="Subcategory" value={ticket.subcategoryName} />
          <DetailItem label="Impact" value={ticket.impactLevelName} />
          <DetailItem label="Urgency" value={ticket.urgencyLevelName} />
          <DetailItem
            label="Resolved at"
            value={
              ticket.resolvedAt
                ? new Date(ticket.resolvedAt).toLocaleString("tr-TR")
                : null
            }
          />
        </dl>
      </Card>
    </div>
  );
}
