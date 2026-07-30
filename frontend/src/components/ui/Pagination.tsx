import { Button } from "./Button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4">
      <Button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        type="button"
        variant="secondary"
      >
        Önceki
      </Button>
      <span className="text-sm text-slate-600">
        Sayfa {page} / {totalPages}
      </span>
      <Button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        type="button"
        variant="secondary"
      >
        Sonraki
      </Button>
    </div>
  );
}
