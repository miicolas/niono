import { DragDropProvider } from "@dnd-kit/react";
import { Button } from "@/components/ui/button";
import { isChoiceType } from "@/lib/databases/property-kinds";
import type { PropertyValue, ViewConfig } from "@/validators/databases";
import { BoardColumn } from "./board-column";
import type { Property, Row } from "./types";
export function BoardLayout({
  pageId,
  properties,
  config,
  query,
  editable,
  onChange,
  onNavigate,
  onAddProperty,
}: {
  pageId: string;
  properties: Property[];
  config: ViewConfig;
  query: string;
  editable: boolean;
  onChange: (
    row: Row,
    property: Property,
    value: PropertyValue
  ) => Promise<void>;
  onNavigate: (id: string) => void;
  onAddProperty: () => void;
}) {
  const groupProperty =
    properties.find((p) => p.id === config.groupBy && isChoiceType(p.type)) ??
    properties.find((p) => isChoiceType(p.type));
  if (!groupProperty) {
    return (
      <div className="empty-state py-10">
        <p>
          Ajoutez une propriété « Statut » ou « Sélection » pour organiser le
          tableau.
        </p>
        {editable && (
          <Button onClick={onAddProperty}>Ajouter une propriété</Button>
        )}
      </div>
    );
  }
  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) {
          return;
        }
        const { source, target } = event.operation;
        const row = source?.data.row as Row | undefined;
        if (row && target && String(target.id).startsWith("group:")) {
          onChange(row, groupProperty, String(target.id).slice(6) || null);
        }
      }}
    >
      <div className="board">
        {[
          { id: "", name: "Sans statut", color: "gray" },
          ...groupProperty.options,
        ].map((group) => (
          <BoardColumn
            config={config}
            editable={editable}
            id={group.id}
            key={group.id}
            name={group.name}
            onChange={onChange}
            onNavigate={onNavigate}
            pageId={pageId}
            property={groupProperty}
            query={query}
          />
        ))}
      </div>
    </DragDropProvider>
  );
}
