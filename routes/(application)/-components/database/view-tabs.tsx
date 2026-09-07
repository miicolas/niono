import { Plus, Table2 } from "lucide-react";
import { layouts } from "./layouts";
import type { Database } from "./types";
export function ViewTabs({
  views,
  selectedId,
  editable,
  onSelect,
  onAdd,
}: {
  views: Database["views"];
  selectedId: string | undefined;
  editable: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="database-tabs">
      {views.map((view) => {
        const Icon =
          layouts.find((l) => l.id === view.config.layout)?.icon ?? Table2;
        return (
          <button
            className={view.id === selectedId ? "active" : ""}
            key={view.id}
            onClick={() => onSelect(view.id)}
            type="button"
          >
            <Icon size={14} />
            {view.name}
          </button>
        );
      })}
      {editable && (
        <button aria-label="Ajouter une vue" onClick={onAdd} type="button">
          <Plus size={14} />
        </button>
      )}
    </div>
  );
}
