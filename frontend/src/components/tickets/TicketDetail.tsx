import { Avatar } from "@/src/components/ui/Avatar";
import { Card } from "@/src/components/ui/Card";
import type { TicketDetailDto } from "@/src/types/ticket";
import { TicketPriorityBadge } from "./TicketPriorityBadge";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { CsatSurveyCard } from "@/src/components/tickets/CsatSurveyCard";

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex flex-col border-b border-slate-200 dark:border-slate-800 py-3 last:border-0 transition-colors">
      <dt className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value || "—"}
      </dd>
    </div>
  );
}

function PersonDetailItem({
  label,
  name,
  avatarUrl,
}: {
  label: string;
  name?: string | null;
  avatarUrl?: string | null;
}) {
  return (
    <div className="flex flex-col border-b border-slate-200 py-3 last:border-0 dark:border-slate-800">
      <dt className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {name ? (
          <>
            <Avatar avatarUrl={avatarUrl} name={name} size="xs" />
            <span>{name}</span>
          </>
        ) : (
          "—"
        )}
      </dd>
    </div>
  );
}

export function TicketHeader({ ticket }: { ticket: TicketDetailDto }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-md bg-blue-100 dark:bg-blue-950/60 px-2.5 py-1 text-sm font-bold tracking-wide text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
          #{ticket.ticketNumber}
        </span>
        <TicketStatusBadge status={ticket.statusName} />
        <TicketPriorityBadge priority={ticket.priorityName} />
      </div>

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {ticket.ticketTitle}
        </h1>
        {ticket.ticketDescription && (
          <p className="mt-2 text-base font-medium text-slate-600 dark:text-slate-300">
            {ticket.ticketDescription}
          </p>
        )}
      </div>

      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
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
    <Card className="shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors" title="Detailed explanation">
      <div className="prose prose-sm max-w-none">
        <p className="whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
          {ticket.subject}
        </p>
      </div>
    </Card>
  );
}

export function TicketMetadata({ ticket }: { ticket: TicketDetailDto }) {
  return (
    <Card className="shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors" title="Ticket information">
      <dl className="flex flex-col">
        <PersonDetailItem
          avatarUrl={ticket.createdByAvatarUrl}
          label="Created by"
          name={ticket.createdByName}
        />
        <DetailItem label="Assigned team" value={ticket.teamName} />
        <PersonDetailItem
          avatarUrl={ticket.assignedToAvatarUrl}
          label="Assigned to"
          name={ticket.assignedToName}
        />
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

export function TicketSurvey({ ticket }: { ticket: TicketDetailDto }) {
  return (
    <CsatSurveyCard
      ticketId={ticket.id}
      ticketStatus={ticket.statusName}
    />
  );
}