import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import type { PropertyValue } from "@/validators/databases";
import { EntryTitleCell } from "./entry-title-cell";
import { PropertyCell } from "./property-cell";
import type { Members, Property, Row } from "./types";
export function useDatabaseColumns({
  visible,
  editable,
  members,
  onNavigate,
  onRefresh,
  onCellChange,
}: {
  visible: Property[];
  editable: boolean;
  members: Members;
  onNavigate: (id: string) => void;
  onRefresh: () => Promise<void>;
  onCellChange: (
    row: Row,
    property: Property,
    value: PropertyValue
  ) => Promise<void>;
}) {
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "title",
        header: "Nom",
        cell: ({ row }) => (
          <EntryTitleCell
            editable={editable}
            onNavigate={onNavigate}
            onRefresh={onRefresh}
            row={row.original}
          />
        ),
      },
      ...visible.map((property) => ({
        id: property.id,
        header: property.name,
        cell: ({ row }: { row: { original: Row } }) => (
          <PropertyCell
            editable={editable}
            key={`${row.original.id}:${property.id}:${row.original.values[property.id]?.revision ?? 0}`}
            members={members}
            onChange={(value) => onCellChange(row.original, property, value)}
            pageId={row.original.id}
            property={property}
            value={row.original.values[property.id]?.value ?? null}
          />
        ),
      })),
    ],
    [visible, editable, members, onNavigate, onRefresh, onCellChange]
  );
}
