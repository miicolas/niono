import { Button } from "@/components/ui/button";
import { TableHead } from "@/components/ui/table";
import { useRef } from "react";
import { useSortable } from "@dnd-kit/react/sortable";
import type { Header } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  EyeOff,
  Filter,
  GripVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { viewSorts, type ViewConfig } from "@digipm/contracts";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { DatabaseProperty } from "./view-controls";

export function ColumnHeader<T>({
  header,
  index,
  name,
  property,
  config,
  editable,
  canMoveLeft,
  canMoveRight,
  onMove,
  onChange,
  onFilter,
  onRename,
  onDelete,
}: {
  header: Header<T, unknown>;
  index: number;
  name: string;
  property?: DatabaseProperty;
  config: ViewConfig;
  editable: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMove: (direction: -1 | 1) => void;
  onChange: (config: ViewConfig) => void;
  onFilter: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const id = header.id;
  const afterClose = useRef<(() => void) | null>(null);
  const drag = useSortable({ id, index, transition: null });
  const sorts = viewSorts(config);
  const sortIndex = sorts.findIndex((sort) => sort.propertyId === id);
  const sort = sorts[sortIndex];
  const resize = (width: number) =>
    onChange({
      ...config,
      columnWidths: {
        ...config.columnWidths,
        [id]: Math.min(800, Math.max(100, width)),
      },
    });
  const setSort = (direction: "asc" | "desc") =>
    onChange({
      ...config,
      sortBy: "position",
      sortDirection: "asc",
      sorts: sort
        ? sorts.map((s) => (s.propertyId === id ? { ...s, direction } : s))
        : [...sorts, { propertyId: id, direction }],
    });
  return (
    <TableHead
      ref={drag.ref}
      style={{ width: header.getSize(), opacity: drag.isDragging ? 0.5 : 1 }}
      className={`database-column-header ${drag.isDropTarget ? "column-drop-target" : ""}`}
      aria-sort={
        sort ? (sort.direction === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <div className="column-heading">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          className="column-grip"
          ref={drag.handleRef}
          aria-label={`Déplacer la colonne ${name}`}
        >
          <GripVertical size={12} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="column-menu-trigger"
              aria-label={`Options de la colonne ${name}`}
            >
              <span>{name}</span>
              {sort && (
                <>
                  {sort.direction === "asc" ? (
                    <ArrowUp size={12} />
                  ) : (
                    <ArrowDown size={12} />
                  )}
                  <small>{sortIndex + 1}</small>
                </>
              )}
              <ChevronDown size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="min-w-56"
            onCloseAutoFocus={(event) => {
              if (!afterClose.current) return;
              event.preventDefault();
              const action = afterClose.current;
              afterClose.current = null;
              requestAnimationFrame(action);
            }}
          >
            {editable && property && (
              <>
                <DropdownMenuItem
                  onSelect={() => {
                    afterClose.current = onRename;
                  }}
                >
                  <Pencil />
                  Renommer la propriété
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              disabled={!sort && sorts.length >= 20}
              onSelect={() => setSort("asc")}
            >
              <ArrowUp />
              Trier par ordre croissant
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!sort && sorts.length >= 20}
              onSelect={() => setSort("desc")}
            >
              <ArrowDown />
              Trier par ordre décroissant
            </DropdownMenuItem>
            {sort && (
              <DropdownMenuItem
                onSelect={() =>
                  onChange({
                    ...config,
                    sortBy: "position",
                    sortDirection: "asc",
                    sorts: sorts.filter((s) => s.propertyId !== id),
                  })
                }
              >
                Retirer ce tri
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              disabled={config.filters.length >= 20}
              onSelect={() => {
                afterClose.current = onFilter;
              }}
            >
              <Filter />
              Filtrer cette propriété
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!canMoveLeft}
              onSelect={() => onMove(-1)}
            >
              <ArrowLeft />
              Déplacer à gauche
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!canMoveRight}
              onSelect={() => onMove(1)}
            >
              <ArrowRight />
              Déplacer à droite
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={header.getSize() <= 100}
              onSelect={() => resize(header.getSize() - 40)}
            >
              Réduire la largeur
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={header.getSize() >= 800}
              onSelect={() => resize(header.getSize() + 40)}
            >
              Augmenter la largeur
            </DropdownMenuItem>
            {property && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() =>
                    onChange({ ...config, hidden: [...config.hidden, id] })
                  }
                >
                  <EyeOff />
                  Masquer dans cette vue
                </DropdownMenuItem>
                {editable && (
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => {
                      afterClose.current = onDelete;
                    }}
                  >
                    <Trash2 />
                    Supprimer la propriété…
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div
        className={`column-resizer ${header.column.getIsResizing() ? "resizing" : ""}`}
        role="separator"
        aria-orientation="vertical"
        aria-label={`Largeur de ${name}`}
        aria-valuemin={100}
        aria-valuemax={800}
        aria-valuenow={Math.round(header.getSize())}
        tabIndex={0}
        onMouseDown={header.getResizeHandler()}
        onTouchStart={header.getResizeHandler()}
        onDoubleClick={() => resize(id === "title" ? 280 : 180)}
        onKeyDown={(e) => {
          if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
            e.preventDefault();
            resize(header.getSize() + (e.key === "ArrowLeft" ? -20 : 20));
          }
        }}
      />
    </TableHead>
  );
}
