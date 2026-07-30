interface LoadingSpinnerProps {
  label?: string;
}

export function LoadingSpinner({
  label = "Yükleniyor...",
}: LoadingSpinnerProps) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-slate-500">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
      <span>{label}</span>
    </div>
  );
}
