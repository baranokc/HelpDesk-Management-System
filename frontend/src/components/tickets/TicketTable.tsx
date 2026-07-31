import Link from "next/link";
import { TicketListDto } from "@/src/types/ticket";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketPriorityBadge } from "./TicketPriorityBadge";

export function TicketTable({ tickets }: { tickets: TicketListDto[] }) {
  if (tickets.length === 0) {
    return (
      <EmptyState
        description="You can find tickets by changing parameters of creating new tickets."
        title="No ticket found"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra min-w-[900px]">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Category</th>
            <th>Assigned to</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr className="hover" key={ticket.id}>
              <td>
                <Link
                  className="link link-primary font-semibold"
                  href={`/tickets/${ticket.id}`}
                >
                  {ticket.ticketNumber}
                </Link>
                <p className="mt-0.5 max-w-sm truncate opacity-70">
                  {ticket.ticketTitle}
                </p>
              </td>
              <td>
                <TicketStatusBadge status={ticket.statusName} />
              </td>
              <td>
                <TicketPriorityBadge
                  priority={ticket.priorityName}
                />
              </td>
              <td>
                {ticket.categoryName}
                {ticket.subcategoryName && (
                  <span className="block text-xs opacity-50">
                    {ticket.subcategoryName}
                  </span>
                )}
              </td>
              <td>
                {ticket.assignedToName ?? "Atanmadı"}
              </td>
              <td>
                {new Intl.DateTimeFormat("tr-TR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(ticket.createdAt))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
