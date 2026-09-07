import { useSortable } from "@dnd-kit/react/sortable";
import { ChevronDown, ChevronRight, GripVertical, Table2 } from "lucide-react";
import { useUI } from "@/lib/ui/store";
import type { PageItem } from "@/routes/(application)/-lib/types";
import { TreePageMenu } from "./tree-page-menu";

type Props = {
  page: PageItem;
  index: number;
  readonly: boolean;
  childrenByParent: Map<string | null, PageItem[]>;
  currentId: string | null;
  onNavigate: (id: string) => void;
  onCreate: (parentId?: string, kind?: "page" | "database") => void;
  onAction: (action: string, page: PageItem) => void;
};
export function TreePage({ page, index, readonly, ...props }: Props) {
  const expanded = useUI((s) => s.expanded[page.id]);
  const toggle = useUI((s) => s.toggleExpanded);
  const children = props.childrenByParent.get(page.id) ?? [];
  const { ref, handleRef, isDragging } = useSortable({
    id: page.id,
    index,
    group: page.parentId ?? "root",
    disabled: readonly,
  });
  return (
    <div className={isDragging ? "dragging" : ""} ref={ref}>
      <div
        className={`tree-row ${props.currentId === page.id ? "active" : ""}`}
      >
        <button
          aria-label={`${expanded ? "Replier" : "Déplier"} ${page.title}`}
          className="tree-chevron"
          onClick={() => toggle(page.id)}
          type="button"
        >
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        <button
          className="page-link"
          onClick={() => props.onNavigate(page.id)}
          type="button"
        >
          <span>
            {page.kind === "database" ? <Table2 size={14} /> : page.icon}
          </span>
          <span>{page.title || "Sans titre"}</span>
        </button>
        {!readonly && (
          <>
            <button
              aria-label={`Déplacer ${page.title}`}
              className="icon-button row-action"
              ref={handleRef}
              type="button"
            >
              <GripVertical size={12} />
            </button>
            <TreePageMenu
              onAction={props.onAction}
              onCreate={props.onCreate}
              page={page}
            />
          </>
        )}
      </div>
      {expanded && (
        <div className="tree-children">
          {children.map((child, i) => (
            <TreePage
              index={i}
              key={child.id}
              page={child}
              {...props}
              readonly={readonly}
            />
          ))}
          {!children.length && (
            <span className="sidebar-helper">Aucune sous-page</span>
          )}
        </div>
      )}
    </div>
  );
}
