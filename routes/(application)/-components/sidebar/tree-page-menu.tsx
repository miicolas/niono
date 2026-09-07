import {
  ArrowUpRight,
  Copy,
  FilePlus2,
  MoreHorizontal,
  Star,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PageItem } from "@/routes/(application)/-lib/types";
export function TreePageMenu({
  page,
  onCreate,
  onAction,
}: {
  page: PageItem;
  onCreate: (parentId?: string, kind?: "page" | "database") => void;
  onAction: (action: string, page: PageItem) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`Actions pour ${page.title}`}
          className="icon-button row-action"
          type="button"
        >
          <MoreHorizontal size={14} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right">
        <DropdownMenuItem onClick={() => onCreate(page.id)}>
          <FilePlus2 />
          Ajouter une sous-page
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("favorite", page)}>
          <Star />
          {page.favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("duplicate", page)}>
          <Copy />
          Dupliquer
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("move", page)}>
          <ArrowUpRight />
          Déplacer vers…
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onAction("trash", page)}
          variant="destructive"
        >
          <Trash2 />
          Mettre à la corbeille
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
