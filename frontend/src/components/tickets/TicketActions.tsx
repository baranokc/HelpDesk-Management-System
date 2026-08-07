"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench,
  UploadCloud,
  RefreshCw,
  UserPlus,
  UserMinus,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Alert } from "@/src/components/ui/Alert";
import { Button } from "@/src/components/ui/Button";
import { Checkbox } from "@/src/components/ui/Checkbox";
import { Modal } from "@/src/components/ui/Modal";
import { Textarea } from "@/src/components/ui/Textarea";
import { getApiErrorMessage } from "@/src/lib/api";
import { ticketAssignmentService } from "@/src/services/ticketAssignmentService";
import { ticketAttachmentService } from "@/src/services/ticketAttachmentService";
import { ticketWorkflowService } from "@/src/services/ticketWorkflowService";
import type { TicketAssignmentDto } from "@/src/types/ticket-assignment";
import type { TicketAttachmentCreateDto } from "@/src/types/ticket-attachment";
import type {
  TicketResolveDto,
  TicketStatusUpdateDto,
} from "@/src/types/ticket-status";
import type { TicketDetailDto } from "@/src/types/ticket";
import { AttachmentUploader } from "./AttachmentUploader";
import { TicketAssignmentForm } from "./TicketAssignmentForm";
import { TicketResolveForm } from "./TicketResolveForm";
import { TicketStatusForm } from "./TicketStatusForm";

type ActionName =
  | "upload"
  | "assign"
  | "unassign"
  | "status"
  | "resolve"
  | "close";

interface TicketActionsProps {
  ticket: TicketDetailDto;
  userRole?: string;
  onChanged: () => Promise<void>;
}

export function TicketActions({
  ticket,
  userRole,
  onChanged,
}: TicketActionsProps) {
  const router = useRouter();
  const [activeAction, setActiveAction] = useState<ActionName | null>(null);
  const [loadingAction, setLoadingAction] = useState<ActionName | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [unassignmentReason, setUnassignmentReason] = useState("");
  const [keepTeamAssignment, setKeepTeamAssignment] = useState(false);

  const canManageWorkflow =
    userRole === "Admin" ||
    userRole === "SupportAgent" ||
    userRole === "TeamLeader";

  const canAssign = userRole === "Admin" || userRole === "TeamLeader";

  const isAssigned = Boolean(ticket.assignedToId);
  const normalizedStatus = ticket.statusName.trim().toLowerCase();

  const canUpdateStatus =
    canManageWorkflow &&
    normalizedStatus !== "resolved" &&
    normalizedStatus !== "closed" &&
    normalizedStatus !== "cancelled";

  const canResolve =
    canManageWorkflow &&
    normalizedStatus !== "resolved" &&
    normalizedStatus !== "closed" &&
    normalizedStatus !== "cancelled";

  const canClose =
    canManageWorkflow && normalizedStatus === "resolved" && !ticket.closedAt;

  const secondaryBtnStyle =
    "dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 hover:!bg-slate-900 hover:!text-white dark:hover:!bg-white dark:hover:!text-slate-900 transition-all shadow-sm";

  const openAction = (action: ActionName) => {
    setActionError(null);
    setActiveAction(action);
  };

  const closeAction = () => {
    if (loadingAction) return;

    setActionError(null);
    setActiveAction(null);
  };

  const runAction = async (
    action: ActionName,
    operation: () => Promise<unknown>,
    fallbackMessage: string,
    refreshAfterSuccess = true,
  ): Promise<boolean> => {
    setLoadingAction(action);
    setActionError(null);

    try {
      await operation();
      setActiveAction(null);

      if (refreshAfterSuccess) {
        await onChanged();
      }

      return true;
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error, fallbackMessage));
      return false;
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUpload = async (dto: TicketAttachmentCreateDto) => {
    const succeeded = await runAction(
      "upload",
      () => ticketAttachmentService.uploadAttachments(ticket.id, dto),
      "The files could not be uploaded. Please try again.",
    );

    if (!succeeded) {
      throw new Error("Attachment upload failed.");
    }
  };

  const handleAssign = async (dto: TicketAssignmentDto) => {
    const isCrossTeamTransfer = dto.teamId !== ticket.teamId;
    const succeeded = await runAction(
      "assign",
      () => ticketAssignmentService.assignTicket(ticket.id, dto),
      "The ticket could not be assigned. Please check the selected team and member.",
      !isCrossTeamTransfer,
    );

    if (succeeded && isCrossTeamTransfer) {
      router.replace("/tickets");
      router.refresh();
    }
  };

  const handleUnassign = async () => {
    const succeeded = await runAction(
      "unassign",
      () =>
        ticketAssignmentService.unassignTicket(ticket.id, {
          reason: unassignmentReason.trim() || null,
          keepTeamAssignment,
        }),
      "The ticket assignment could not be removed.",
    );

    if (succeeded) {
      setUnassignmentReason("");
      setKeepTeamAssignment(false);
    }
  };

  const handleStatusUpdate = async (dto: TicketStatusUpdateDto) => {
    await runAction(
      "status",
      () => ticketWorkflowService.updateStatus(dto),
      "The ticket status could not be updated.",
    );
  };

  const handleResolve = async (dto: TicketResolveDto) => {
    await runAction(
      "resolve",
      () => ticketWorkflowService.resolveTicket(ticket.id, dto),
      "The ticket could not be resolved.",
    );
  };

  const handleClose = async () => {
    await runAction(
      "close",
      () => ticketWorkflowService.closeTicket(ticket.id),
      "The ticket could not be closed.",
    );
  };

  const errorAlert = actionError ? (
    <div className="mb-4">
      <Alert variant="error">{actionError}</Alert>
    </div>
  ) : null;

  return (
    <>
      {/* KART DÜZENİ */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-5 shadow-lg space-y-4">
        <div className="space-y-1 pb-3 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
              <Wrench className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Ticket Actions
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Upload files and perform the workflow actions available for your role.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Button
            onClick={() => openAction("upload")}
            size="sm"
            className="!inline-flex !items-center !justify-center !gap-2 !px-3.5 !py-2.5 !rounded-xl !text-xs !font-semibold
                       !text-indigo-600 dark:!text-indigo-400 !bg-indigo-500/10 !border !border-indigo-500/20
                       hover:!bg-indigo-500/20 hover:!border-indigo-500/40 transition-all active:scale-[0.98] shadow-sm"
          >
            <UploadCloud className="h-3.5 w-3.5 shrink-0" />
            <span>Upload files</span>
          </Button>

          {canUpdateStatus && (
            <Button
              onClick={() => openAction("status")}
              size="sm"
              variant="secondary"
              className="!inline-flex !items-center !justify-center !gap-2 !px-3.5 !py-2.5 !rounded-xl !text-xs !font-semibold
                         !text-slate-700 dark:!text-slate-200 !bg-slate-100/80 dark:!bg-slate-800/60 !border !border-slate-200/80 dark:!border-slate-700/60
                         hover:!bg-slate-200/80 dark:hover:!bg-slate-800 hover:!text-indigo-600 dark:hover:!text-indigo-400 hover:!border-indigo-500/30 transition-all active:scale-[0.98]"
            >
              <RefreshCw className="h-3.5 w-3.5 shrink-0 text-sky-500" />
              <span>Update status</span>
            </Button>
          )}

          {canAssign && (
            <Button
              onClick={() => openAction("assign")}
              size="sm"
              variant="secondary"
              className="!inline-flex !items-center !justify-center !gap-2 !px-3.5 !py-2.5 !rounded-xl !text-xs !font-semibold
                         !text-slate-700 dark:!text-slate-200 !bg-slate-100/80 dark:!bg-slate-800/60 !border !border-slate-200/80 dark:!border-slate-700/60
                         hover:!bg-slate-200/80 dark:hover:!bg-slate-800 hover:!text-indigo-600 dark:hover:!text-indigo-400 hover:!border-indigo-500/30 transition-all active:scale-[0.98]"
            >
              <UserPlus className="h-3.5 w-3.5 shrink-0 text-purple-400" />
              <span>{isAssigned ? "Reassign ticket" : "Assign ticket"}</span>
            </Button>
          )}

          {canAssign && isAssigned && (
            <Button
              onClick={() => openAction("unassign")}
              size="sm"
              variant="danger"
              className="!inline-flex !items-center !justify-center !gap-2 !px-3.5 !py-2.5 !rounded-xl !text-xs !font-semibold
                         !text-rose-600 dark:!text-rose-400 !bg-rose-500/10 !border !border-rose-500/20
                         hover:!bg-rose-500/20 hover:!border-rose-500/40 transition-all active:scale-[0.98]"
            >
              <UserMinus className="h-3.5 w-3.5 shrink-0" />
              <span>Remove assignment</span>
            </Button>
          )}

          {canResolve && (
            <Button
              onClick={() => openAction("resolve")}
              size="sm"
              variant="secondary"
              className="!inline-flex !items-center !justify-center !gap-2 !px-3.5 !py-2.5 !rounded-xl !text-xs !font-semibold
                         !text-emerald-600 dark:!text-emerald-400 !bg-emerald-500/10 !border !border-emerald-500/20
                         hover:!bg-emerald-500/20 hover:!border-emerald-500/40 transition-all active:scale-[0.98] shadow-sm"
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Resolve ticket</span>
            </Button>
          )}

          {canClose && (
            <Button
              onClick={() => openAction("close")}
              size="sm"
              variant="danger"
              className="!inline-flex !items-center !justify-center !gap-2 !px-3.5 !py-2.5 !rounded-xl !text-xs !font-semibold
                         !text-rose-600 dark:!text-rose-400 !bg-rose-500/10 !border !border-rose-500/20
                         hover:!bg-rose-500/20 hover:!border-rose-500/40 transition-all active:scale-[0.98]"
            >
              <XCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Close ticket</span>
            </Button>
          )}
        </div>
      </div>

      {/* ORİJİNAL MODALLAR */}
      <Modal
        onClose={closeAction}
        open={activeAction === "upload"}
        title="Upload ticket files"
      >
        {errorAlert}
        <AttachmentUploader
          loading={loadingAction === "upload"}
          onUpload={handleUpload}
        />
      </Modal>

      <Modal
        onClose={closeAction}
        open={activeAction === "assign"}
        title={isAssigned ? "Reassign ticket" : "Assign ticket"}
      >
        {errorAlert}
        <TicketAssignmentForm
          currentTeamId={ticket.teamId}
          loading={loadingAction === "assign"}
          onSubmit={handleAssign}
        />
      </Modal>

      <Modal
        onClose={closeAction}
        open={activeAction === "status"}
        title="Update ticket status"
      >
        {errorAlert}
        <TicketStatusForm
          currentStatusId={ticket.statusId}
          loading={loadingAction === "status"}
          onSubmit={handleStatusUpdate}
          ticketId={ticket.id}
        />
      </Modal>

      <Modal
        onClose={closeAction}
        open={activeAction === "resolve"}
        title="Resolve ticket"
      >
        {errorAlert}
        <TicketResolveForm
          loading={loadingAction === "resolve"}
          onSubmit={handleResolve}
        />
      </Modal>

      <Modal
        onClose={closeAction}
        open={activeAction === "unassign"}
        title="Remove ticket assignment"
      >
        {errorAlert}

        <div className="space-y-4">
          <Textarea
            hint={`${unassignmentReason.length}/250 characters`}
            label="Reason"
            maxLength={250}
            onChange={(event) => setUnassignmentReason(event.target.value)}
            value={unassignmentReason}
          />

          <Checkbox
            checked={keepTeamAssignment}
            label="Keep the ticket assigned to the current team"
            onChange={(event) => setKeepTeamAssignment(event.target.checked)}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              className={secondaryBtnStyle}
              onClick={closeAction}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              loading={loadingAction === "unassign"}
              onClick={() => void handleUnassign()}
              type="button"
              variant="danger"
            >
              Remove assignment
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        onClose={closeAction}
        open={activeAction === "close"}
        title="Close ticket"
      >
        {errorAlert}

        <p className="text-sm text-slate-600 dark:text-slate-300">
          The ticket will be moved from Resolved to Closed. The ticket creator
          will receive a notification.
        </p>

        <div className="mt-6 flex justify-end gap-3 pt-2">
          <Button
            className={secondaryBtnStyle}
            onClick={closeAction}
            type="button"
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            loading={loadingAction === "close"}
            onClick={() => void handleClose()}
            type="button"
            variant="danger"
          >
            Close ticket
          </Button>
        </div>
      </Modal>
    </>
  );
}