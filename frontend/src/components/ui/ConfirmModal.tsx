"use client";

import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal onClose={onClose} open={open} title={title}>
      <p className="text-sm opacity-70">{description}</p>
      <div className="modal-action">
        <Button onClick={onClose} type="button" variant="secondary">
          {cancelLabel}
        </Button>
        <Button
          loading={loading}
          onClick={() => void onConfirm()}
          type="button"
          variant={danger ? "danger" : "primary"}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
