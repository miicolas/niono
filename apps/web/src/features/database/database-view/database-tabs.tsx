import type { DatabaseState } from "./shared";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { layouts } from "./shared";

export function DatabaseTabs({
  metadata,
  editable,
  setPanel,
}: Pick<DatabaseState, "metadata" | "editable" | "setPanel">) {
  return (
    <div className="database-tabs">
      <TabsList
        className="h-auto bg-transparent p-0"
        aria-label="Vues de la base"
      >
        {metadata.data?.views.map((view) => {
          const Icon =
            layouts.find((layout) => layout.id === view.config.layout)?.icon ??
            Table2;
          return (
            <TabsTrigger key={view.id} value={view.id} className="database-tab">
              <Icon size={14} />
              {view.name}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {editable && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Ajouter une vue"
          onClick={() => setPanel("view")}
        >
          <Plus size={14} />
        </Button>
      )}
    </div>
  );
}
