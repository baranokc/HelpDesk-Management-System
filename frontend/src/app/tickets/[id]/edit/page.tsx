import { TicketEditContainer } from "@/src/components/tickets/TicketEditContainer";

interface TicketEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketEditPage({ params }: TicketEditPageProps) {
  const { id } = await params;

  return <TicketEditContainer ticketId={id} />;
}
