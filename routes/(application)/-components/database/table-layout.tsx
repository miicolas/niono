import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowUpDown, Plus } from "lucide-react";
import { useRef } from "react";
import type { ViewConfig } from "@/validators/databases";
import type { Row } from "./types";
export function TableLayout({
  rows,
  columns,
  config,
  setConfig,
  editable,
  onAddProperty,
}: {
  rows: Row[];
  columns: ColumnDef<Row>[];
  config: ViewConfig;
  setConfig: (config: ViewConfig) => void;
  editable: boolean;
  onAddProperty: () => void;
}) {
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    autoResetPageIndex: false,
  });
  const tableScroll = useRef<HTMLDivElement>(null);
  const tableRows = table.getRowModel().rows;
  const virtual = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => tableScroll.current,
    estimateSize: () => 38,
    overscan: 8,
  });
  const virtualRows = virtual.getVirtualItems();
  const topPadding = virtualRows[0]?.start ?? 0;
  const last = virtualRows.at(-1);
  const bottomPadding = last ? virtual.getTotalSize() - last.end : 0;
  const sortBy = (id: string) =>
    setConfig({
      ...config,
      sortBy: id,
      sortDirection:
        config.sortBy === id && config.sortDirection === "asc" ? "desc" : "asc",
    });
  return (
    <div
      className="database-table-scroll"
      ref={tableScroll}
      style={{ maxHeight: "60svh", overflow: "auto" }}
    >
      <table className="database-table">
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th key={header.id}>
                  <button onClick={() => sortBy(header.id)} type="button">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    <ArrowUpDown size={10} />
                  </button>
                </th>
              ))}
              {editable && (
                <th>
                  <button onClick={onAddProperty} type="button">
                    <Plus size={13} />
                    Propriété
                  </button>
                </th>
              )}
            </tr>
          ))}
        </thead>
        <tbody>
          {topPadding > 0 && (
            <tr>
              <td
                aria-hidden="true"
                colSpan={columns.length + 1}
                style={{ height: topPadding, padding: 0 }}
              />
            </tr>
          )}
          {virtualRows.map((item) => {
            const row = tableRows[item.index];
            if (!row) {
              return null;
            }
            return (
              <tr
                data-index={item.index}
                key={row.id}
                ref={virtual.measureElement}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
                {editable && <td />}
              </tr>
            );
          })}
          {bottomPadding > 0 && (
            <tr>
              <td
                aria-hidden="true"
                colSpan={columns.length + 1}
                style={{ height: bottomPadding, padding: 0 }}
              />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
