"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit3, Trash2, MessageSquarePlus, AlertTriangle } from "lucide-react";
import { Alert } from "@/src/components/ui/Alert";
import { Button } from "@/src/components/ui/Button";
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
import {
  TicketHeader,
  TicketMetadata,
  TicketSubject,
  TicketSurvey,
} from "./TicketDetail";
import { TicketDetailTabs } from "./TicketDetailTabs";
import { TicketHistory } from "./TicketHistory";
import { TicketSlaCard } from "./TicketSlaCard";

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

  // 🌟 LIGHT & DARK MOD UYUMLU GELİŞTİRİLMİŞ HATA EKRANI (Ticket Not Found vb.)
  if (loadError || !ticket) {
    return (
      <div className="mx-auto max-w-md pt-16">
        <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 shadow-2xl text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 dark:border-rose-500/30 shadow-inner">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-black tracking-tight text-stone-900 dark:text-white">
              Unable to load ticket
            </h2>
            <p className="text-xs font-medium text-stone-500 dark:text-slate-400">
              {loadError ?? "The requested ticket could not be found or you do not have permission to view it."}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button onClick={() => void loadTicket()} variant="danger" className="w-full sm:w-auto !rounded-xl !text-xs !font-bold">
              Try again
            </Button>

            <Link
              href="/tickets"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-stone-700 dark:text-slate-200 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-300/80 dark:border-slate-700 transition-all shadow-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to tickets</span>
            </Link>
          </div>
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
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both relative">
      {/* Arka Plan Aura Efektleri */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-amber-500/10 dark:bg-purple-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-teal-500/10 dark:bg-indigo-600/15 blur-3xl pointer-events-none" />

      {/* ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/80 dark:border-purple-900/30 pb-4">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold
                     text-stone-700 dark:text-slate-300
                     bg-white/80 dark:bg-slate-900/80
                     border border-stone-300/80 dark:border-purple-800/40
                     hover:bg-stone-100 dark:hover:bg-slate-800/80
                     hover:text-emerald-800 dark:hover:text-purple-300
                     hover:border-emerald-600/40 dark:hover:border-purple-500/50
                     transition-all shadow-sm active:scale-95 shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to tickets</span>
        </Link>

        {canManage && (
          <div className="flex items-center gap-2">
            <Link
              href={`/tickets/${ticket.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-800 dark:text-purple-300 bg-emerald-500/15 dark:bg-purple-500/20 hover:bg-emerald-500/25 dark:hover:bg-purple-500/30 border border-emerald-600/30 dark:border-purple-500/40 transition-all active:scale-95"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit ticket</span>
            </Link>

            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-600/30 dark:border-rose-500/40 transition-all active:scale-95"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete ticket</span>
            </button>
          </div>
        )}
      </div>

      {deleteError && <Alert variant="error">{deleteError}</Alert>}
      {attachmentError && <Alert variant="error">{attachmentError}</Alert>}

      {/* GRID CONTAINER */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* SOL İÇERİK SÜTUNU */}
        <div className="space-y-6 lg:col-span-2">
          <TicketHeader ticket={ticket} />
          <TicketSubject ticket={ticket} />

          {/* Müşteri Memnuniyeti Anketi */}
          {user?.role === "User" && <TicketSurvey ticket={ticket} />}

          {/* TABLAR */}
          <div className="pt-2">
            <TicketDetailTabs
              attachmentCount={ticketLevelAttachments.length}
              attachments={
                <div className="mt-4">
                  <TicketAttachments
                    attachments={ticketLevelAttachments}
                    downloadingAttachmentId={downloadingAttachmentId}
                    onDownload={handleDownloadAttachment}
                    ticketId={ticketId}
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
                    ticketId={ticketId}
                  />

                  {/* YORUM EKLEME KARTI */}
                  <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-slate-800/80">
                      <MessageSquarePlus className="h-4 w-4 text-emerald-700 dark:text-purple-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-slate-200">
                        Add a comment
                      </h3>
                    </div>

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

        {/* SAĞ YAPIŞKAN (STICKY) SÜTUN */}
        <div className="sticky top-20 space-y-6 lg:col-span-1">
          <TicketActions
            onChanged={() => loadTicket(false)}
            ticket={ticket}
            userRole={user?.role}
          />
          <TicketMetadata ticket={ticket} />
          {ticket.sla && <TicketSlaCard sla={ticket.sla} />}
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