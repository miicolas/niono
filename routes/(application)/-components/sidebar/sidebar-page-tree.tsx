import { DragDropProvider } from "@dnd-kit/react";
import { Plus } from "lucide-react";
import { useMemo } from "react";
import { SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import type { PageItem } from "@/routes/(application)/-lib/types";
import { TreePage } from "./tree-page";
export function SidebarPageTree({
  pages,
  currentId,
  readonly,
  onNavigate,
  onCreate,
  onAction,
  onMove,
}: {
  pages: PageItem[];
  currentId: string | null;
  readonly: boolean;
  onNavigate: (id: string) => void;
  onCreate: (parentId?: string, kind?: "page" | "database") => void;
  onAction: (action: string, page: PageItem) => void;
  onMove: (id: string, parentId: string | null, beforeId?: string) => void;
}) {
  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, PageItem[]>();
    for (const page of pages) {
      const siblings = map.get(page.parentId) ?? [];
      siblings.push(page);
      map.set(page.parentId, siblings);
    }
    return map;
  }, [pages]);
  const roots = childrenByParent.get(null) ?? [];
  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <span>Pages de l’espace</span>
        {!readonly && (
          <button
            aria-label="Créer une page"
            className="icon-button ml-auto"
            onClick={() => onCreate()}
            type="button"
          >
            <Plus size={13} />
          </button>
        )}
      </SidebarGroupLabel>
      <DragDropProvider
        onDragEnd={(event) => {
          if (event.canceled) {
            return;
          }
          const { source, target } = event.operation;
          if (source && target && source.id !== target.id) {
            const targetPage = pages.find((p) => p.id === target.id);
            if (targetPage) {
              onMove(String(source.id), targetPage.parentId, targetPage.id);
            }
          }
        }}
      >
        {roots.map((page, index) => (
          <TreePage
            childrenByParent={childrenByParent}
            currentId={currentId}
            index={index}
            key={page.id}
            onAction={onAction}
            onCreate={onCreate}
            onNavigate={onNavigate}
            page={page}
            readonly={readonly}
          />
        ))}
      </DragDropProvider>
      {!readonly && (
        <button
          className="muted w-full list-row"
          onClick={() => onCreate()}
          type="button"
        >
          <Plus size={15} />
          Nouvelle page
        </button>
      )}
      {!roots.length && (
        <p className="sidebar-helper">
          Un espace à remplir d’idées.
          <br />
          Créez votre première page.
        </p>
      )}
    </SidebarGroup>
  );
}
