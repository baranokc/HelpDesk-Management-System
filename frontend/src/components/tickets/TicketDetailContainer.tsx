"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/src/components/ui/Alert";
import { Button, LinkButton } from "@/src/components/ui/Button";
import { ConfirmModal } from "@/src/components/ui/ConfirmModal";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { useAuth } from "@/src/context/AuthContext";
import { getApiErrorMessage } from "@/src/lib/api";
import { canManageTicket } from "@/src/lib/ticketPermissions";
import { ticketAttachmentService } from "@/src/services/ticketAttachmentService";
import { ticketCommentService } from "@/src/services/ticketCommentService";
import { ticketService } from "@/src/services/ticketService";
import { ticketWorkflowService } from "@/src/services/ticketWorkflowService";
import type { TicketAttachmentDto } from "@/src/types/ticket-attachment";
import type { TicketCommentCreateDto } from "@/src/types/ticket-comment";
import type { TicketHistoryDto } from "@/src/types/ticket-status";
import type { TicketDetailDto } from "@/src/types/ticket";
import { CommentForm } from "./CommentForm";
import { TicketActions } from "./TicketActions";
import { TicketAttachments } from "./TicketAttachments";
import { TicketComments } from "./TicketComments";
import { TicketHeader, TicketMetadata, TicketSubject } from "./TicketDetail";
import { TicketDetailTabs } from "./TicketDetailTabs";
import { TicketHistory } from "./TicketHistory";

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
  const [history, setHistory] = useState<TicketHistoryDto[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<
    string | null
  >(null);

  const loadTicket = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setLoadError(null);
      setHistoryError(null);

      try {
        const data = await ticketService.getById(ticketId);
        setTicket(data);

        try {
          setHistory(await ticketWorkflowService.getHistory(ticketId));
        } catch (error: unknown) {
          setHistoryError(
            getApiErrorMessage(error, "Ticket history could not be loaded."),
          );
        }
      } catch (error: unknown) {
        setLoadError(
          getApiErrorMessage(
            error,
            "Failed to load ticket details. Please try again later.",
          ),
        );
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [ticketId],
  );

  useEffect(() => {
    void loadTicket(true);
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

  const ticketLevelAttachments = (ticket.attachments ?? []).filter(
    (attachment) => !attachment.commentId,
  );
  const canManage = canManageTicket(user, ticket);
  const canCreateInternal =
    canCreateInternalComment ??
    (user?.role === "Admin" ||
      user?.role === "TeamLeader" ||
      user?.role === "SupportAgent");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors">
        <LinkButton
          href="/tickets"
          size="sm"
          variant="secondary"
          className="dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 hover:!bg-slate-900 hover:!text-white dark:hover:!bg-white dark:hover:!text-slate-900"
        >
          ← Back to tickets
        </LinkButton>

        {canManage && (
          <div className="flex gap-2">
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
          </div>
        )}
      </div>

      {deleteError && <Alert variant="error">{deleteError}</Alert>}
      {attachmentError && <Alert variant="error">{attachmentError}</Alert>}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <TicketHeader ticket={ticket} />
          <TicketSubject ticket={ticket} />

          <div className="mt-8">
            <TicketDetailTabs
              attachmentCount={ticketLevelAttachments.length}
              attachments={
                <div className="mt-4">
                  <TicketAttachments
                    attachments={ticketLevelAttachments}
                    downloadingAttachmentId={downloadingAttachmentId}
                    onDownload={handleDownloadAttachment}
                  />
                </div>
              }
              commentCount={ticket.comments?.length ?? 0}
              comments={
                <div className="mt-4 space-y-6">
                  <TicketComments
                    comments={ticket.comments ?? []}
                    downloadingAttachmentId={downloadingAttachmentId}
                    onDownloadAttachment={handleDownloadAttachment}
                  />
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-md transition-colors">
                    <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">
                      Add a comment
                    </h3>
                    {commentError && (
                      <div className="mb-4">
                        <Alert variant="error">{commentError}</Alert>
                      </div>
                    )}
                    <CommentForm
                      canCreateInternal={canCreateInternal}
                      loading={submittingComment}
                      onSubmit={handleAddComment}
                    />
                  </div>
                </div>
              }
              history={
                <div className="mt-4">
                  {historyError && (
                    <div className="mb-4">
                      <Alert variant="error">{historyError}</Alert>
                    </div>
                  )}
                  <TicketHistory history={history} />
                </div>
              }
            />
          </div>
        </div>

        <div className="sticky top-6 space-y-6 lg:col-span-1">
          <TicketActions
            onChanged={() => loadTicket(false)}
            ticket={ticket}
            userRole={user?.role}
          />
          <TicketMetadata ticket={ticket} />
        </div>
      </div>

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