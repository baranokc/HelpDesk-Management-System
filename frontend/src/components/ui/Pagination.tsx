import { Button } from "./Button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <div className="join">
        <Button
          className="join-item"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          type="button"
          variant="secondary"
        >
          Önceki
        </Button>
        <span className="btn join-item pointer-events-none">
          Sayfa {page} / {totalPages}
        </span>
        <Button
          className="join-item"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          type="button"
          variant="secondary"
        >
          Sonraki
        </Button>
      </div>
    </div>
  );
}
