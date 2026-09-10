import { Skeleton } from "@/components/ui/skeleton";

export function CardsSkeleton() {
  return (
    <div>
      <span role="status" className="sr-only">
        Chargement des pages récentes…
      </span>
      <div className="recent-grid" aria-hidden="true">
        {[0, 1, 2].map((card) => (
          <div className="recent-card skeleton-recent-card" key={card}>
            <Skeleton className="size-7" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
