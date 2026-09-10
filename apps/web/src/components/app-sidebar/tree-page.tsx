import {
  Trash2,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  GripVertical,
  FilePlus2,
  Copy,
  Star,
  ArrowUpRight,
  Table2,
} from "lucide-react";
import { useSortable } from "@dnd-kit/react/sortable";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useUI } from "@/lib/ui-store";
import type { PageItem } from "@/features/workspace/types";
import { type Props } from "./shared";

export function TreePage({
  page,
  index,
  readonly,
  childrenByParent,
  ...props
}: Props & {
  page: PageItem;
  index: number;
  readonly: boolean;
  childrenByParent: Map<string | null, PageItem[]>;
}) {
  const expanded = useUI((s) => s.expanded[page.id]);
  const toggle = useUI((s) => s.toggleExpanded);
  const children = childrenByParent.get(page.id) ?? [];
  const { ref, handleRef, isDragging } = useSortable({
    id: page.id,
    index,
    group: page.parentId ?? "root",
    disabled: readonly,
  });
  return (
    <div ref={ref} className={isDragging ? "dragging" : ""}>
      <div
        className={`tree-row ${props.currentId === page.id ? "active" : ""}`}
      >
        <Button
          variant="ghost"
          size="sm"
          type="button"
          className="tree-chevron"
          aria-label={`${expanded ? "Replier" : "Déplier"} ${page.title}`}
          onClick={() => toggle(page.id)}
        >
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          className="page-link"
          onClick={() => props.onNavigate(page.id)}
        >
          <span>
            {page.kind === "database" ? <Table2 size={14} /> : page.icon}
          </span>
          <span>{page.title || "Sans titre"}</span>
        </Button>
        {!readonly && (
          <>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              ref={handleRef}
              className="icon-button row-action"
              aria-label={`Déplacer ${page.title}`}
            >
              <GripVertical size={12} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="icon-button row-action"
                  aria-label={`Actions pour ${page.title}`}
                >
                  <MoreHorizontal size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start">
                <DropdownMenuItem onClick={() => props.onCreate(page.id)}>
                  <FilePlus2 />
                  Ajouter une sous-page
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => props.onAction("favorite", page)}
                >
                  <Star />
                  {page.favorite
                    ? "Retirer des favoris"
                    : "Ajouter aux favoris"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => props.onAction("duplicate", page)}
                >
                  <Copy />
                  Dupliquer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => props.onAction("move", page)}>
                  <ArrowUpRight />
                  Déplacer vers…
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => props.onAction("trash", page)}
                >
                  <Trash2 />
                  Mettre à la corbeille
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
      {expanded && (
        <div className="tree-children">
          {children.map((child, i) => (
            <TreePage
              key={child.id}
              page={child}
              childrenByParent={childrenByParent}
              index={i}
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
