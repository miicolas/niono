import { ContentState } from "@/components/content-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { flexRender } from "@tanstack/react-table";
import { isSortable } from "@dnd-kit/react/sortable";
import { DragDropProvider } from "@dnd-kit/react";
import { Table2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moveColumn } from "../view-controls";
import { ColumnHeader } from "../column-header";
import { type DatabaseState } from "./shared";

export function DatabaseTable({
  config,
  visibleOrder,
  setConfig,
  columnOrder,
  tableScroll,
  table,
  editable,
  properties,
  setFilterRequest,
  selected,
  setPropertyAction,
  setPanel,
  rowsQuery,
  columns,
  rows,
  query,
  topPadding,
  virtualRows,
  tableRows,
  virtual,
  bottomPadding,
}: Pick<
  DatabaseState,
  | "config"
  | "visibleOrder"
  | "setConfig"
  | "columnOrder"
  | "tableScroll"
  | "table"
  | "editable"
  | "properties"
  | "setFilterRequest"
  | "selected"
  | "setPropertyAction"
  | "setPanel"
  | "rowsQuery"
  | "columns"
  | "rows"
  | "query"
  | "topPadding"
  | "virtualRows"
  | "tableRows"
  | "virtual"
  | "bottomPadding"
>) {
  return (
    config.layout === "table" && (
      <DragDropProvider
        onDragEnd={(event) => {
          if (event.canceled) return;
          const source = event.operation.source;
          if (isSortable(source) && source.initialIndex !== source.index) {
            const id = visibleOrder[source.initialIndex];
            const target = visibleOrder[source.index];
            if (id && target)
              setConfig({
                ...config,
                columnOrder: moveColumn(columnOrder, id, target),
              });
          }
        }}
      >
        <div
          ref={tableScroll}
          className="database-table-scroll"
          style={{ maxHeight: "60svh", overflow: "auto" }}
        >
          <Table
            containerClassName="overflow-visible"
            className="database-table managed-database-table"
            style={{
              width: table.getTotalSize() + (editable ? 130 : 0),
              tableLayout: "fixed",
            }}
          >
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header, index) => {
                    const property = properties.find((p) => p.id === header.id);
                    return (
                      <ColumnHeader
                        key={header.id}
                        header={header}
                        index={index}
                        name={property?.name ?? "Nom"}
                        property={property}
                        config={config}
                        editable={editable}
                        canMoveLeft={index > 0}
                        canMoveRight={index < group.headers.length - 1}
                        onMove={(direction) =>
                          setConfig({
                            ...config,
                            columnOrder: moveColumn(
                              columnOrder,
                              header.id,
                              visibleOrder[index + direction]!,
                            ),
                          })
                        }
                        onChange={setConfig}
                        onFilter={() =>
                          setFilterRequest({
                            id: header.id,
                            key: Date.now(),
                            viewId: selected?.id,
                          })
                        }
                        onRename={() =>
                          property &&
                          setPropertyAction({
                            property,
                            action: "rename",
                          })
                        }
                        onDelete={() =>
                          property &&
                          setPropertyAction({
                            property,
                            action: "delete",
                          })
                        }
                      />
                    );
                  })}
                  {editable && (
                    <TableHead style={{ width: 130 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        aria-label="Ajouter une propriété"
                        onClick={() => setPanel("property")}
                      >
                        <Plus size={13} />
                        Propriété
                      </Button>
                    </TableHead>
                  )}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rowsQuery.isPending && rowsQuery.fetchStatus !== "paused" && (
                <>
                  <TableRow className="sr-only">
                    <TableCell colSpan={columns.length + (editable ? 1 : 0)}>
                      <span role="status">Chargement des entrées…</span>
                    </TableCell>
                  </TableRow>
                  {[0, 1, 2, 3, 4].map((row) => (
                    <TableRow key={`loading-${row}`} aria-hidden="true">
                      {visibleOrder.map((id) => (
                        <TableCell key={id}>
                          <Skeleton className="my-1 h-3 w-3/5" />
                        </TableCell>
                      ))}
                      {editable && (
                        <TableCell>
                          <Skeleton className="my-1 h-3 w-1/3" />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </>
              )}
              {!rowsQuery.isPending &&
                !rowsQuery.error &&
                rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + (editable ? 1 : 0)}
                      className="database-table-empty text-center muted py-6!"
                    >
                      <ContentState
                        compact
                        icon={config.filters.length || query ? Search : Table2}
                        title={
                          config.filters.length || query
                            ? "Aucun résultat dans cette vue"
                            : "Votre base attend sa première page"
                        }
                        description={
                          config.filters.length || query
                            ? "Modifiez votre recherche ou vos filtres pour retrouver vos pages."
                            : editable
                              ? "Ajoutez une première page pour commencer à organiser vos idées."
                              : "Les pages ajoutées à cette base apparaîtront ici."
                        }
                      />
                    </TableCell>
                  </TableRow>
                )}
              {topPadding > 0 && (
                <TableRow aria-hidden="true">
                  <TableCell
                    colSpan={columns.length + 1}
                    style={{ height: topPadding, padding: 0 }}
                  />
                </TableRow>
              )}
              {virtualRows.map((item) => {
                const row = tableRows[item.index]!;
                return (
                  <TableRow
                    key={row.id}
                    data-index={item.index}
                    ref={virtual.measureElement}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                    {editable && <TableCell />}
                  </TableRow>
                );
              })}
              {bottomPadding > 0 && (
                <TableRow aria-hidden="true">
                  <TableCell
                    colSpan={columns.length + 1}
                    style={{ height: bottomPadding, padding: 0 }}
                  />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DragDropProvider>
    )
  );
}
