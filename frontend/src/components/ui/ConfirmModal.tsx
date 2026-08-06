"use client";

import { AlertTriangle, X } from "lucide-react";

export interface ConfirmModalProps {
  open?: boolean;
  isOpen?: boolean;
  title?: string;
  description?: string;
  message?: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info" | string;
  danger?: boolean;
  loading?: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmModal(props: ConfirmModalProps) {
  // Farklı prop isimleri gelse bile hepsini yakalayan esnek mantık
  const show = props.open ?? props.isOpen ?? false;
  const title = props.title ?? "Confirm Action";
  const bodyText = props.description ?? props.message ?? "Are you sure you want to proceed?";
  const confirmBtnText = props.confirmText ?? props.confirmLabel ?? "Delete";
  const cancelBtnText = props.cancelText ?? props.cancelLabel ?? "Cancel";
  const isBusy = props.loading ?? props.isLoading ?? false;
  const variant = props.variant ?? "danger";

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={props.onClose}
    >
      <div 
        className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kapat X Butonu */}
        <button
          type="button"
          onClick={props.onClose}
          disabled={isBusy}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          {/* İkon */}
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            variant === "danger" 
              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60"
              : "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60"
          }`}>
            <AlertTriangle className="h-6 w-6" />
          </div>

          {/* Başlık & Metin */}
          <div className="space-y-1 pt-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {bodyText}
            </p>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={props.onClose}
            disabled={isBusy}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all disabled:opacity-50 cursor-pointer"
          >
            {cancelBtnText}
          </button>

          <button
            type="button"
            onClick={props.onConfirm}
            disabled={isBusy}
            className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer ${
              variant === "danger"
                ? "bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 shadow-rose-500/20"
                : "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20"
            }`}
          >
            {isBusy ? "Deleting..." : confirmBtnText}
          </button>
        </div>
      </div>
    </div>
  );
}