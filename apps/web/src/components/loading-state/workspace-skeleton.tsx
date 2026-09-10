import { BrandLogo } from "@/components/brand-logo";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingLabel } from "./loading-label";
import { CardsSkeleton } from "./cards-skeleton";

export function WorkspaceSkeleton() {
  return (
    <div className="workspace-skeleton">
      <aside className="workspace-skeleton-sidebar" aria-hidden="true">
        <div className="app-state-brand">
          <BrandLogo decorative />
          <span>DigiPM</span>
        </div>
        <div className="skeleton-nav-group">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} />
          ))}
        </div>
        <div className="skeleton-nav-group">
          {[0, 1, 2, 3, 4].map((row) => (
            <Skeleton key={row} />
          ))}
        </div>
        <div className="skeleton-nav-footer">
          <Skeleton className="size-7" />
          <Skeleton className="h-3 w-24" />
        </div>
      </aside>
      <main className="workspace-skeleton-main">
        <div className="workspace-skeleton-topbar">
          <LoadingLabel>Ouverture de votre espace…</LoadingLabel>
        </div>
        <div aria-hidden="true" className="home">
          <Skeleton className="h-2.5 w-44" />
          <Skeleton className="mt-6 h-9 w-3/5" />
          <Skeleton className="mt-5 h-3 w-2/5" />
          <div className="home-section">
            <CardsSkeleton />
          </div>
          <div className="skeleton-home-rows">
            <Skeleton />
            <Skeleton />
          </div>
        </div>
      </main>
    </div>
  );
}
