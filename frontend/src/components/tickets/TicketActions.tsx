"use client";

import { useState } from "react";
import { Alert } from "@/src/components/ui/Alert";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
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

type ActionName = "upload" | "assign" | "unassign" | "status" | "resolve";

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
  const [activeAction, setActiveAction] = useState<ActionName | null>(null);
  const [loadingAction, setLoadingAction] = useState<ActionName | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [unassignmentReason, setUnassignmentReason] = useState("");
  const [keepTeamAssignment, setKeepTeamAssignment] = useState(false);

const canManageWorkflow =
  userRole === "Admin" ||
  userRole === "SupportAgent" ||
  userRole === "TeamLeader";

const canAssign =
  userRole === "Admin" ||
  userRole === "TeamLeader";

const isAssigned = Boolean(ticket.assignedToId || ticket.teamId);
const normalizedStatus = ticket.statusName.trim().toLowerCase();

const canResolve =
  canManageWorkflow &&
  normalizedStatus !== "resolved" &&
  normalizedStatus !== "closed";

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
  ): Promise<boolean> => {
    setLoadingAction(action);
    setActionError(null);

    try {
      await operation();
      setActiveAction(null);
      await onChanged();
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
    await runAction(
      "assign",
      () => ticketAssignmentService.assignTicket(ticket.id, dto),
      "The ticket could not be assigned. Please check the selected team and member.",
    );
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

  const errorAlert = actionError ? (
    <div className="mb-4">
      <Alert variant="error">{actionError}</Alert>
    </div>
  ) : null;

  return (
    <>
      <Card
        className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors shadow-sm"
        description="Upload files and perform the workflow actions available for your role."
        title="Ticket actions"
      >
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => openAction("upload")} size="sm">
            Upload files
          </Button>

          <Button
            className={secondaryBtnStyle}
            onClick={() => openAction("status")}
            size="sm"
            variant="secondary"
          >
            Update status
          </Button>

          {canAssign && (
            <Button
              className={secondaryBtnStyle}
              onClick={() => openAction("assign")}
              size="sm"
              variant="secondary"
            >
              {isAssigned ? "Reassign ticket" : "Assign ticket"}
            </Button>
          )}

          {canAssign && isAssigned && (
            <Button
              onClick={() => openAction("unassign")}
              size="sm"
              variant="danger"
            >
              Remove assignment
            </Button>
          )}

          {canResolve && (
            <Button
              className={secondaryBtnStyle}
              onClick={() => openAction("resolve")}
              size="sm"
              variant="secondary"
            >
              Resolve ticket
            </Button>
          )}
        </div>
      </Card>

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

          <div className="flex justify-end gap-3">
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
    </>
  );
}