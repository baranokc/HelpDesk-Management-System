import { TicketHistoryDto } from "@/src/types/ticket-status";
import { EmptyState } from "@/src/components/ui/EmptyState";

export function TicketHistory({
  history,
}: {
  history: TicketHistoryDto[];
}) {
  if (history.length === 0) {
    return <EmptyState title="No history record." />;
  }

  return (
    <ul className="timeline timeline-vertical timeline-compact">
      {history.map((item) => (
        <li key={item.id}>
          <hr />
          <div className="timeline-middle">
            <span className="status status-primary" />
          </div>
          <div className="timeline-end mb-6 w-full">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-semibold">
                {item.description || item.fieldName || String(item.actionType)}
              </p>
              <time className="text-xs opacity-50">
                {new Date(item.changedAt).toLocaleString("tr-TR")}
              </time>
            </div>
            <p className="mt-1 text-xs opacity-60">
              {item.changedByName || "System"}
              {item.oldValue != null && item.newValue != null
                ? ` · ${item.oldValue} → ${item.newValue}`
                : ""}
            </p>
          </div>
          <hr />
        </li>
      ))}
    </ul>
  );
}
