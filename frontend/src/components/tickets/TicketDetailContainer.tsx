"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/src/components/ui/Alert";
import { Button, LinkButton } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { ticketCommentService } from "@/src/services/ticketCommentService";
import { ticketService } from "@/src/services/ticketService";
import type { TicketCommentCreateDto } from "@/src/types/ticket-comment";
import type { TicketDetailDto } from "@/src/types/ticket";
import { CommentForm } from "./CommentForm";
import { TicketComments } from "./TicketComments";
import { TicketDetail } from "./TicketDetail";

interface TicketDetailContainerProps {
  ticketId: string;
  canCreateInternalComment?: boolean;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ?? fallback
  );
}

export function TicketDetailContainer({
  ticketId,
  canCreateInternalComment = false,
}: TicketDetailContainerProps) {
  const [ticket, setTicket] = useState<TicketDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadTicket = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const data = await ticketService.getById(ticketId);
      setTicket(data);
    } catch (error: unknown) {
      setLoadError(
        getErrorMessage(
          error,
          "Failed to load ticket details. Please try again later.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    void loadTicket();
  }, [loadTicket]);

  const handleAddComment = async (dto: TicketCommentCreateDto) => {
    setSubmittingComment(true);
    setCommentError(null);

    try {
      const createdComment = await ticketCommentService.createComment(
        ticketId,
        dto,
      );

      setTicket((currentTicket) =>
        currentTicket
          ? {
              ...currentTicket,
              comments: [...(currentTicket.comments ?? []), createdComment],
            }
          : currentTicket,
      );
    } catch (error: unknown) {
      setCommentError(
        getErrorMessage(
          error,
          "An error occurred while adding the comment.",
        ),
      );

      // CommentForm catches this rejection and keeps the entered values.
      throw error;
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading ticket details..." />;
  }

  if (loadError || !ticket) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Alert variant="error">{loadError ?? "Ticket not found."}</Alert>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void loadTicket()} variant="danger">
            Try again
          </Button>
          <LinkButton href="/tickets" variant="secondary">
            Back to tickets
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex justify-end">
        <LinkButton href="/tickets" size="sm" variant="secondary">
          ← Back to tickets
        </LinkButton>
      </div>

      <TicketDetail ticket={ticket} />

      <Card
        description={`${ticket.comments?.length ?? 0} comment(s)`}
        title="Comments"
      >
        <TicketComments comments={ticket.comments ?? []} />

        <div className="mt-6 space-y-4 border-t border-base-300 pt-6">
          <h3 className="text-base font-semibold">Add a comment</h3>

          {commentError && <Alert variant="error">{commentError}</Alert>}

          <CommentForm
            canCreateInternal={canCreateInternalComment}
            loading={submittingComment}
            onSubmit={handleAddComment}
          />
        </div>
      </Card>
    </div>
  );
}
