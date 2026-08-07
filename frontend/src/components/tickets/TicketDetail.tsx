import {
  AlignLeft,
  Clock,
  FolderTree,
  Tag,
  User,
  Users,
  Zap,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Avatar } from "@/src/components/ui/Avatar";
import type { TicketDetailDto } from "@/src/types/ticket";
import { TicketPriorityBadge } from "./TicketPriorityBadge";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { CsatSurveyCard } from "@/src/components/tickets/CsatSurveyCard";

function DetailItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-stone-200/60 dark:border-slate-800/60 last:border-0 transition-colors">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-emerald-700 dark:text-purple-400" />}
        {label}
      </dt>
      <dd className="text-xs font-semibold text-stone-900 dark:text-slate-100 font-mono text-right">
        {value || "—"}
      </dd>
    </div>
  );
}

function PersonDetailItem({
  label,
  name,
  avatarUrl,
  icon: Icon,
}: {
  label: string;
  name?: string | null;
  avatarUrl?: string | null;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-stone-200/60 dark:border-slate-800/60 last:border-0 transition-colors">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-emerald-700 dark:text-purple-400" />}
        {label}
      </dt>
      <dd className="flex items-center gap-2 text-xs font-semibold text-stone-900 dark:text-slate-100">
        {name ? (
          <>
            <Avatar avatarUrl={avatarUrl} name={name} size="xs" className="border border-stone-300 dark:border-purple-700" />
            <span className="truncate max-w-[130px] font-medium">{name}</span>
          </>
        ) : (
          <span className="text-stone-400 font-mono">—</span>
        )}
      </dd>
    </div>
  );
}

export function TicketHeader({ ticket }: { ticket: TicketDetailDto }) {
  const formattedDate = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(ticket.createdAt));

  return (
    <div className="space-y-3.5 p-6 rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-mono font-bold tracking-wide text-emerald-800 dark:text-purple-300 bg-emerald-500/15 dark:bg-purple-500/20 border border-emerald-600/30 dark:border-purple-500/40">
          #{ticket.ticketNumber}
        </span>
        <TicketStatusBadge status={ticket.statusName} />
        <TicketPriorityBadge
          priority={ticket.priorityName}
          urgency={ticket.urgencyLevelName}
        />
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-800 via-emerald-800 to-teal-900 dark:from-purple-300 dark:via-violet-200 dark:to-indigo-200 bg-clip-text text-transparent sm:text-3xl">
          {ticket.ticketTitle}
        </h1>
        {ticket.ticketDescription && (
          <p className="text-xs sm:text-sm font-medium text-stone-600 dark:text-slate-300">
            {ticket.ticketDescription}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] font-medium text-stone-400 dark:text-slate-500 pt-2 border-t border-stone-200/80 dark:border-slate-800/80">
        <Clock className="h-3.5 w-3.5 text-emerald-700 dark:text-purple-400" />
        <span>Created at {formattedDate}</span>
      </div>
    </div>
  );
}

export function TicketSubject({ ticket }: { ticket: TicketDetailDto }) {
  return (
    <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-6 shadow-xl space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-stone-200/80 dark:border-slate-800/80">
        <AlignLeft className="h-4 w-4 text-emerald-700 dark:text-purple-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-slate-200">
          Detailed Explanation
        </span>
      </div>
      <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-stone-800 dark:text-slate-200 font-medium">
        {ticket.subject}
      </p>
    </div>
  );
}

export function TicketMetadata({ ticket }: { ticket: TicketDetailDto }) {
  return (
    <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-5 shadow-xl space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-stone-200/80 dark:border-slate-800/80">
        <Info className="h-4 w-4 text-emerald-700 dark:text-purple-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-slate-200">
          Ticket Information
        </span>
      </div>

      <dl className="flex flex-col">
        <PersonDetailItem
          avatarUrl={ticket.createdByAvatarUrl}
          icon={User}
          label="Created by"
          name={ticket.createdByName}
        />
        <DetailItem icon={Users} label="Assigned team" value={ticket.teamName} />
        <PersonDetailItem
          avatarUrl={ticket.assignedToAvatarUrl}
          icon={User}
          label="Assigned to"
          name={ticket.assignedToName}
        />
        <DetailItem icon={FolderTree} label="Category" value={ticket.categoryName} />
        <DetailItem icon={Tag} label="Subcategory" value={ticket.subcategoryName} />
        <DetailItem icon={Zap} label="Impact" value={ticket.impactLevelName} />
        <DetailItem icon={AlertCircle} label="Urgency" value={ticket.urgencyLevelName} />
        {ticket.resolvedAt && (
          <DetailItem
            icon={CheckCircle2}
            label="Resolved at"
            value={new Date(ticket.resolvedAt).toLocaleString("tr-TR")}
          />
        )}
      </dl>
    </div>
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