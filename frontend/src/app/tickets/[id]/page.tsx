import { TicketDetailContainer } from "@/src/components/tickets/TicketDetailContainer";

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({
  params,
}: TicketDetailPageProps) {
  const { id } = await params;

  return <TicketDetailContainer ticketId={id} />;
}
