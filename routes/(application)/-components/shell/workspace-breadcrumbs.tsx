import type { PageItem } from "@/routes/(application)/-lib/types";
export function WorkspaceBreadcrumbs({
  workspaceName,
  current,
  pages,
  onNavigate,
}: {
  workspaceName?: string;
  current?: PageItem;
  pages: PageItem[];
  onNavigate: (id: string | null) => void;
}) {
  const parentId = current?.parentId;
  const parentTitle = parentId
    ? (pages.find((p) => p.id === parentId)?.title ?? "Page")
    : undefined;
  return (
    <nav aria-label="Fil d’Ariane" className="breadcrumbs">
      <button onClick={() => onNavigate(null)} type="button">
        {workspaceName}
      </button>
      {current && (
        <>
          <span>/</span>
          {parentId && (
            <>
              <button onClick={() => onNavigate(parentId)} type="button">
                {parentTitle}
              </button>
              <span>/</span>
            </>
          )}
          <span className="current">
            {current.icon} {current.title}
          </span>
        </>
      )}
    </nav>
  );
}
