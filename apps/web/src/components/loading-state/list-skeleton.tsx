import { Skeleton } from "@/components/ui/skeleton";
import { LoadingLabel } from "./loading-label";

export function ListSkeleton({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="list-skeleton">
      <LoadingLabel>{label}</LoadingLabel>
      <div aria-hidden="true">
        {[0, 1, 2].map((row) => (
          <div className="skeleton-list-row" key={row}>
            <Skeleton className="skeleton-list-icon" />
            <div>
              <Skeleton />
              <Skeleton />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
