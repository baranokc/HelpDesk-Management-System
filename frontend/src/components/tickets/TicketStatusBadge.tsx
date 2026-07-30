import { Badge } from "@/src/components/ui/Badge";

export function TicketStatusBadge({ status }: { status: string }) {
  const normalized = status.toLocaleLowerCase("tr-TR");
  const tone =
    normalized.includes("Fix") || normalized.includes("Close")
      ? "green"
      : normalized.includes("Back")
        ? "amber"
        : normalized.includes("Cancel")
          ? "red"
          : normalized.includes("Update")
            ? "blue"
            : "slate";

  return <Badge tone={tone}>{status}</Badge>;
}
