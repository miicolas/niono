import { Skeleton } from "@/components/ui/skeleton";
import { LoadingLabel } from "./loading-label";

export function DatabaseSkeleton() {
  return (
    <div className="database-skeleton">
      <LoadingLabel>Chargement de la base…</LoadingLabel>
      <div className="skeleton-table" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((row) => (
          <div className="skeleton-table-row" key={row}>
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        ))}
      </div>
    </div>
  );
}
