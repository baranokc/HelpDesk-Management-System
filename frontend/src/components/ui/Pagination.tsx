import { Button } from "./Button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

const paginationButtonClass =
  "join-item !border-slate-300 !bg-white !text-slate-800 " +
  "hover:!bg-slate-100 " +
  "dark:!border-slate-600 dark:!bg-slate-800 dark:!text-slate-100 " +
  "dark:hover:!bg-slate-700 disabled:!cursor-not-allowed disabled:!opacity-50";

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <div className="join">
        <Button
          className={paginationButtonClass}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          type="button"
          variant="secondary"
        >
          Previous
        </Button>
        <span
          className="btn join-item pointer-events-none !border-slate-300 !bg-slate-100 !text-slate-800 dark:!border-slate-600 dark:!bg-slate-900 dark:!text-slate-100"
        >
          Page {page} / {totalPages}
        </span>
        <Button
          className={paginationButtonClass}
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          type="button"
          variant="secondary"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
