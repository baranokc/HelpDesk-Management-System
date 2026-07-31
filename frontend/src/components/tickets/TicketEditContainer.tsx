"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/src/components/ui/Alert";
import { LinkButton } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { useAuth } from "@/src/context/AuthContext";
import { getApiErrorMessage } from "@/src/lib/api";
import { canManageTicket } from "@/src/lib/ticketPermissions";
import { ticketService } from "@/src/services/ticketService";
import type { TicketDetailDto, TicketUpdateDto } from "@/src/types/ticket";
import { TicketForm } from "./TicketForm";

interface TicketEditContainerProps {
  ticketId: string;
}

export function TicketEditContainer({ ticketId }: TicketEditContainerProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [ticket, setTicket] = useState<TicketDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadTicket = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      setTicket(await ticketService.getById(ticketId));
    } catch (error: unknown) {
      setLoadError(
        getApiErrorMessage(
          error,
          "Ticket not found or you do not have permission to edit it.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    void loadTicket();
  }, [loadTicket]);

  const handleSubmit = async (dto: TicketUpdateDto) => {
    setSaving(true);
    setSaveError(null);

    try {
      await ticketService.update(ticketId, dto);
      router.replace(`/tickets/${ticketId}`);
      router.refresh();
    } catch (error: unknown) {
      setSaveError(
        getApiErrorMessage(
          error,
          "An error occurred while updating the ticket.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner label="Loading ticket..." />;
  }

  if (loadError || !ticket) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert variant="error">{loadError ?? "Ticket not found."}</Alert>
        <LinkButton href="/tickets" variant="secondary">
          Back to tickets
        </LinkButton>
      </div>
    );
  }

  if (!canManageTicket(user, ticket)) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert variant="error">
          You do not have permission to edit this ticket.
        </Alert>
        <LinkButton href="/tickets" variant="secondary">
          Back to tickets
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex justify-end">
        <LinkButton href={`/tickets/${ticketId}`} size="sm" variant="secondary">
          Cancel
        </LinkButton>
      </div>

      <Card
        description={`${ticket.ticketNumber} — update the ticket details below.`}
        title="Edit ticket"
      >
        <TicketForm
          error={saveError ?? undefined}
          initialTicket={ticket}
          loading={saving}
          onSubmit={(dto) => handleSubmit(dto as TicketUpdateDto)}
        />
      </Card>
    </div>
  );
}
