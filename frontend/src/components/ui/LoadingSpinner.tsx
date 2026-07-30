interface LoadingSpinnerProps {
  label?: string;
}

export function LoadingSpinner({
  label = "Yükleniyor...",
}: LoadingSpinnerProps) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-3 text-sm opacity-60">
      <span className="loading loading-spinner loading-md text-primary" />
      <span>{label}</span>
    </div>
  );
}
