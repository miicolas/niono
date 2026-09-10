import { ContentState } from "@/components/content-state";
import { DragDropProvider } from "@dnd-kit/react";
import { Kanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type DatabaseState, type Row } from "./shared";
import { BoardColumn } from "./board-column";

export function DatabaseBoard({
  config,
  groupProperty,
  updateCell,
  pageId,
  query,
  editable,
  onNavigate,
  setPanel,
}: Pick<
  DatabaseState,
  | "config"
  | "groupProperty"
  | "updateCell"
  | "pageId"
  | "query"
  | "editable"
  | "onNavigate"
  | "setPanel"
>) {
  return (
    config.layout === "board" &&
    (groupProperty ? (
      <DragDropProvider
        onDragEnd={(event) => {
          if (event.canceled) return;
          const { source, target } = event.operation;
          const row = source?.data.row as Row | undefined;
          if (row && target && String(target.id).startsWith("group:"))
            void updateCell(
              row,
              groupProperty,
              String(target.id).slice(6) || null,
            );
        }}
      >
        <div className="board">
          {[
            { id: "", name: "Sans statut", color: "gray" },
            ...groupProperty.options,
          ].map((group) => (
            <BoardColumn
              key={group.id}
              id={group.id}
              name={group.name}
              pageId={pageId}
              property={groupProperty}
              config={config}
              query={query}
              onChange={updateCell}
              editable={editable}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </DragDropProvider>
    ) : (
      <ContentState
        compact
        icon={Kanban}
        title="Organisez vos pages en colonnes"
        description="Une propriété « Statut » ou « Sélection » permet de regrouper les pages dans ce tableau."
      >
        {editable && (
          <Button onClick={() => setPanel("property")}>
            Ajouter une propriété
          </Button>
        )}
      </ContentState>
    ))
  );
}
