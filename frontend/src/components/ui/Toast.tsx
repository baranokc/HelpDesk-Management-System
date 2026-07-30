interface ToastProps {
  message: string;
  variant?: "info" | "success" | "error";
  onClose?: () => void;
}

const variants = {
  info: "alert-info",
  success: "alert-success",
  error: "alert-error",
};

export function Toast({
  message,
  variant = "info",
  onClose,
}: ToastProps) {
  return (
    <div className="toast toast-end toast-top z-50">
      <div className={`alert ${variants[variant]}`} role="status">
        <span>{message}</span>
        {onClose && (
          <button
            aria-label="Bildirimi kapat"
            className="btn btn-circle btn-ghost btn-xs"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
