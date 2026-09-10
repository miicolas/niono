import { Skeleton } from "@/components/ui/skeleton";
import { LoadingLabel } from "./loading-label";

export function DocumentSkeleton({ bodyOnly = false }: { bodyOnly?: boolean }) {
  return (
    <div
      className={
        bodyOnly ? "editor-skeleton" : "document-content document-skeleton"
      }
    >
      <div aria-hidden="true" className="skeleton-document-shapes">
        {!bodyOnly && (
          <>
            <Skeleton className="skeleton-page-icon" />
            <Skeleton className="skeleton-page-title" />
            <div className="skeleton-meta">
              <Skeleton />
              <Skeleton />
            </div>
          </>
        )}
        <div className="skeleton-paragraph">
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
        <div className="skeleton-paragraph">
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      </div>
      <LoadingLabel>
        {bodyOnly ? "Préparation de l’éditeur…" : "Ouverture de la page…"}
      </LoadingLabel>
    </div>
  );
}
