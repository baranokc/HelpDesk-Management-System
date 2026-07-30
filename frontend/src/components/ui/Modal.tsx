"use client";

import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export function Modal({ open, title, children, onClose }: ModalProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  if (!open) return null;

  return (
    <dialog
      aria-modal="true"
      className="modal modal-open"
      role="dialog"
    >
      <div className="modal-box max-w-xl">
        <div className="flex items-center justify-between border-b border-base-300 pb-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            aria-label="Pencereyi kapat"
            className="btn btn-circle btn-ghost btn-sm"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <div className="pt-5">{children}</div>
      </div>
      <form className="modal-backdrop" method="dialog">
        <button onClick={onClose} type="button">kapat</button>
      </form>
    </dialog>
  );
}
