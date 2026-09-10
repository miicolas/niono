import { listWorkspacePeople } from "@/lib/organization";
import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import { type ViewConfig, type PropertyValue } from "@digipm/contracts";
import { client } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reportError } from "@/lib/notifications";
import { type Row, type Property } from "./shared";
import { PropertyCell } from "./property-cell";

export function useDatabaseTable({
  rows,
  visible,
  editable,
  members,
  onNavigate,
  refresh,
  updateCell,
  visibleOrder,
  config,
  setConfig,
}: {
  rows: Row[];
  visible: Property[];
  editable: boolean;
  members: { data?: Awaited<ReturnType<typeof listWorkspacePeople>> };
  onNavigate: (id: string) => void;
  refresh: () => Promise<void>;
  updateCell: (
    row: Row,
    property: Property,
    value: PropertyValue,
  ) => Promise<void>;
  visibleOrder: string[];
  config: ViewConfig;
  setConfig: (value: ViewConfig) => void;
}) {
  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "title",
        header: "Nom",
        size: 280,
        cell: ({ row }) => (
          <div className="entry-title">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              aria-label={`Ouvrir ${row.original.title}`}
              onClick={() => onNavigate(row.original.id)}
            >
              {row.original.icon}
            </Button>
            {editable ? (
              <Input
                aria-label={`Nom de ${row.original.title}`}
                defaultValue={row.original.title}
                key={row.original.title}
                onBlur={async (e) => {
                  if (e.target.value === row.original.title) return;
                  try {
                    await client.pages.update({
                      id: row.original.id,
                      title: e.target.value,
                      expectedRevision: row.original.revision,
                    });
                    await refresh();
                  } catch (error) {
                    reportError(error);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
              />
            ) : (
              <span>{row.original.title}</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="open-entry"
              onClick={() => onNavigate(row.original.id)}
              aria-label={`Ouvrir la page ${row.original.title}`}
            >
              ↗
            </Button>
          </div>
        ),
      },
      ...visible.map((property) => ({
        id: property.id,
        header: property.name,
        cell: ({ row }: { row: { original: Row } }) => (
          <PropertyCell
            key={`${row.original.id}:${property.id}:${row.original.values[property.id]?.revision ?? 0}`}
            pageId={row.original.id}
            property={property}
            value={row.original.values[property.id]?.value ?? null}
            editable={editable}
            members={members.data ?? []}
            onChange={(value) => void updateCell(row.original, property, value)}
          />
        ),
      })),
    ],
    [visible, editable, members.data, onNavigate, refresh, updateCell],
  );
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    autoResetPageIndex: false,
    state: { columnOrder: visibleOrder, columnSizing: config.columnWidths },
    defaultColumn: { size: 180, minSize: 100, maxSize: 800 },
    columnResizeMode: "onEnd",
    onColumnSizingChange: (updater) =>
      setConfig({
        ...config,
        columnWidths:
          typeof updater === "function"
            ? updater(config.columnWidths)
            : updater,
      }),
  });
  const tableScroll = useRef<HTMLDivElement>(null);
  const tableRows = table.getRowModel().rows;
  const virtual = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => tableScroll.current,
    estimateSize: () => 38,
    overscan: 8,
    enabled: config.layout === "table",
  });
  const virtualRows = virtual.getVirtualItems();
  const topPadding = virtualRows[0]?.start ?? 0;
  const bottomPadding = virtualRows.length
    ? virtual.getTotalSize() - virtualRows[virtualRows.length - 1]!.end
    : 0;
  return {
    columns,
    table,
    tableScroll,
    tableRows,
    virtual,
    virtualRows,
    topPadding,
    bottomPadding,
  };
}
