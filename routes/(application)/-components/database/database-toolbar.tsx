import { FileDown, Plus, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
export function DatabaseToolbar({
  query,
  onQueryChange,
  onOpenOptions,
  onExport,
  editable,
  busy,
  onAdd,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onOpenOptions: () => void;
  onExport: () => void;
  editable: boolean;
  busy: boolean;
  onAdd: () => Promise<void>;
}) {
  return (
    <div className="database-toolbar">
      <div className="database-search">
        <Search size={13} />
        <input
          aria-label="Rechercher dans la base"
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Rechercher…"
          value={query}
        />
      </div>
      <button
        aria-label="Filtres et tri"
        className="icon-button"
        onClick={onOpenOptions}
        type="button"
      >
        <SlidersHorizontal size={14} />
      </button>
      <button
        aria-label="Exporter les lignes affichées en CSV"
        className="icon-button"
        onClick={onExport}
        type="button"
      >
        <FileDown size={14} />
      </button>
      {editable && (
        <Button disabled={busy} onClick={() => onAdd()} size="sm">
          <Plus size={13} />
          Nouveau
        </Button>
      )}
    </div>
  );
}
