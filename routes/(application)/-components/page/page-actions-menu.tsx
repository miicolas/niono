import {
  ArrowUpRight,
  Clock3,
  Copy,
  FileDown,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  canEdit: boolean;
  onAction: (action: string) => void;
  onExportArchive: () => void;
  onHistory: () => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
};

export function PageActionsMenu({
  canEdit,
  onAction,
  onExportArchive,
  onHistory,
  onExportMarkdown,
  onExportJson,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Actions de la page"
          className="icon-button"
          type="button"
        >
          <MoreHorizontal size={17} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onExportArchive}>
          <FileDown />
          Exporter la page et ses sous-pages
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onHistory}>
          <Clock3 />
          Historique des versions
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportMarkdown}>
          <FileDown />
          Exporter en Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportJson}>
          <FileDown />
          Exporter en JSON
        </DropdownMenuItem>
        {canEdit && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAction("duplicate")}>
              <Copy />
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("move")}>
              <ArrowUpRight />
              Déplacer vers…
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onAction("trash")}
              variant="destructive"
            >
              <Trash2 />
              Mettre à la corbeille
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
