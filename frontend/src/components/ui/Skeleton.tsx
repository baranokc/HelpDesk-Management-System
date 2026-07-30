interface SkeletonProps {
  rows?: number;
}

export function Skeleton({ rows = 4 }: SkeletonProps) {
  return (
    <div className="space-y-3" aria-label="İçerik yükleniyor">
      <div className="skeleton h-8 w-1/3" />
      {Array.from({ length: rows }, (_, index) => (
        <div className="skeleton h-12 w-full" key={index} />
      ))}
    </div>
  );
}
