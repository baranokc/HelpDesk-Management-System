"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/src/components/ui/Alert";
import { Button, LinkButton } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { ConfirmModal } from "@/src/components/ui/ConfirmModal";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { useAuth } from "@/src/context/AuthContext";
import { getApiErrorMessage } from "@/src/lib/api";
import { canManageTicket } from "@/src/lib/ticketPermissions";
import { ticketAttachmentService } from "@/src/services/ticketAttachmentService";
import { ticketCommentService } from "@/src/services/ticketCommentService";
import { ticketService } from "@/src/services/ticketService";
import type { TicketAttachmentDto } from "@/src/types/ticket-attachment";
import type { TicketCommentCreateDto } from "@/src/types/ticket-comment";
import type { TicketDetailDto } from "@/src/types/ticket";
import { CommentForm } from "./CommentForm";
import { TicketAttachments } from "./TicketAttachments";
import { TicketComments } from "./TicketComments";
import { TicketDetail } from "./TicketDetail";

interface TicketDetailContainerProps {
  ticketId: string;
  canCreateInternalComment?: boolean;
}

export function TicketDetailContainer({
  ticketId,
  canCreateInternalComment,
}: TicketDetailContainerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<TicketDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<
    string | null
  >(null);

  const loadTicket = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const data = await ticketService.getById(ticketId);
      setTicket(data);
    } catch (error: unknown) {
      setLoadError(
        getApiErrorMessage(
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
        getApiErrorMessage(
          error,
          "An error occurred while adding the comment.",
        ),
      );

      throw error;
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDownloadAttachment = async (attachment: TicketAttachmentDto) => {
    setAttachmentError(null);
    setDownloadingAttachmentId(attachment.id);

    try {
      await ticketAttachmentService.downloadAttachment(ticketId, attachment);
    } catch (error: unknown) {
      setAttachmentError(
        getApiErrorMessage(
          error,
          "The attachment could not be downloaded. Please try again.",
        ),
      );
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);

    try {
      await ticketService.delete(ticketId);
      setDeleteModalOpen(false);
      router.replace("/tickets");
      router.refresh();
    } catch (error: unknown) {
      setDeleteError(
        getApiErrorMessage(
          error,
          "An error occurred while deleting the ticket.",
        ),
      );
    } finally {
      setDeleting(false);
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

  // The backend also returns comment attachments in ticket.attachments.
  // Keep only ticket-level attachments here to prevent duplicate rendering.
  const ticketLevelAttachments = (ticket.attachments ?? []).filter(
    (attachment) => !attachment.commentId,
  );
  const canManage = canManageTicket(user, ticket);
  const canCreateInternal =
    canCreateInternalComment ??
    (user?.role === "Admin" || user?.role === "SupportAgent");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap justify-end gap-3">
        <LinkButton href="/tickets" size="sm" variant="secondary">
          ← Back to tickets
        </LinkButton>

        {canManage && (
          <>
            <LinkButton
              href={`/tickets/${ticket.id}/edit`}
              size="sm"
              variant="primary"
            >
              Edit ticket
            </LinkButton>
            <Button
              onClick={() => setDeleteModalOpen(true)}
              size="sm"
              variant="danger"
            >
              Delete ticket
            </Button>
          </>
        )}
      </div>

      {deleteError && <Alert variant="error">{deleteError}</Alert>}

      <TicketDetail ticket={ticket} />

      {attachmentError && <Alert variant="error">{attachmentError}</Alert>}

      <Card
        description={`${ticketLevelAttachments.length} attachment(s)`}
        title="Attachments"
      >
        <TicketAttachments
          attachments={ticketLevelAttachments}
          downloadingAttachmentId={downloadingAttachmentId}
          onDownload={handleDownloadAttachment}
        />
      </Card>

      <Card
        description={`${ticket.comments?.length ?? 0} comment(s)`}
        title="Comments"
      >
        <TicketComments
          comments={ticket.comments ?? []}
          downloadingAttachmentId={downloadingAttachmentId}
          onDownloadAttachment={handleDownloadAttachment}
        />

        <div className="mt-6 space-y-4 border-t border-base-300 pt-6">
          <h3 className="text-base font-semibold">Add a comment</h3>

          {commentError && <Alert variant="error">{commentError}</Alert>}

          <CommentForm
            canCreateInternal={canCreateInternal}
            loading={submittingComment}
            onSubmit={handleAddComment}
          />
        </div>
      </Card>

      <ConfirmModal
        confirmLabel="Delete ticket"
        danger
        description="This ticket will be removed from active ticket lists. This action cannot be undone from the interface."
        loading={deleting}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        open={deleteModalOpen}
        title="Delete this ticket?"
      />
    </div>
  );
}
