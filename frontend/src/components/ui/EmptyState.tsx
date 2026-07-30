interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="hero min-h-56 rounded-box border border-dashed border-base-300 bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-3 text-4xl opacity-40">◎</div>
          <h3 className="font-semibold">{title}</h3>
          {description && (
            <p className="mt-1 text-sm opacity-60">{description}</p>
          )}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </div>
  );
}
