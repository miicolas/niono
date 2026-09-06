import { DragDropProvider } from "@dnd-kit/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowUpDown,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileDown,
  GalleryHorizontalEnd,
  Kanban,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  Table2,
} from "lucide-react";
import Papa from "papaparse";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { download } from "@/lib/ui/download";
import { reportError } from "@/lib/ui/notifications";
import { client } from "@/orpc/client";
import {
  defaultViewConfig,
  type FilterOperator,
  filterOperatorsFor,
  isChoiceType,
  type PropertyValue,
  type ViewConfig,
  viewSchema,
} from "@/validators/contracts";
import { BoardColumn } from "./board-column";
import { displayValue } from "./display-value";
import { PropertyCell } from "./property-cell";
import { PropertyForm } from "./property-form";
import type { Property, Row } from "./types";

const operatorLabels: Record<FilterOperator, string> = {
  contains: "contient",
  eq: "est égal à",
  neq: "différent de",
  gt: "supérieur à",
  lt: "inférieur à",
  empty: "est vide",
};
const noRows: Row[] = [];
const noProperties: Property[] = [];
const layouts = [
  { id: "table", name: "Table", icon: Table2 },
  { id: "board", name: "Tableau", icon: Kanban },
  { id: "list", name: "Liste", icon: List },
  { id: "gallery", name: "Galerie", icon: GalleryHorizontalEnd },
  { id: "calendar", name: "Calendrier", icon: CalendarDays },
] as const;
export function DatabaseView({
  pageId,
  workspaceId,
  editable,
  onNavigate,
  onRefresh,
}: {
  pageId: string;
  workspaceId: string;
  editable: boolean;
  onNavigate: (id: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const cache = useQueryClient();
  const metadata = useQuery({
    queryKey: ["database", pageId],
    queryFn: () => client.databases.get({ id: pageId }),
  });
  const routeSearch = useSearch({ from: "/" });
  const navigate = useNavigate();
  const viewId = routeSearch.view;
  const setViewId = (id: string) =>
    void navigate({ to: "/", search: (prev) => ({ ...prev, view: id }) });
  const [localConfig, setLocalConfig] = useState<ViewConfig | null>(null);
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [panel, setPanel] = useState<"none" | "property" | "view" | "options">(
    "none"
  );
  const [month, setMonth] = useState(new Date());
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setLocalConfig(null);
    setOffset(0);
  }, [viewId]);
  const selected =
    metadata.data?.views.find((v) => v.id === viewId) ??
    metadata.data?.views[0];
  const config = localConfig ?? selected?.config ?? defaultViewConfig;
  const properties = metadata.data?.properties ?? noProperties;
  const groupProperty =
    properties.find((p) => p.id === config.groupBy && isChoiceType(p.type)) ??
    properties.find((p) => isChoiceType(p.type));
  const dateProperty =
    properties.find((p) => p.id === config.groupBy && p.type === "date") ??
    properties.find((p) => p.type === "date");
  const calendarRange = {
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  };
  const calendarScope =
    config.layout === "calendar" && dateProperty
      ? {
          propertyId: dateProperty.id,
          from: format(calendarRange.start, "yyyy-MM-dd"),
          to: format(calendarRange.end, "yyyy-MM-dd"),
        }
      : undefined;
  const rowsQuery = useQuery({
    queryKey: ["entries", pageId, config, query, offset, calendarScope],
    queryFn: () =>
      client.databases.query({
        pageId,
        config,
        query,
        offset,
        limit: 50,
        scope: calendarScope,
      }),
    enabled: !!metadata.data && config.layout !== "board",
  });
  const rows = rowsQuery.data?.rows ?? noRows;
  const visible = properties.filter((p) => !config.hidden.includes(p.id));
  const members = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => client.workspace.members({ workspaceId }),
    enabled: properties.some((p) => p.type === "person"),
  });
  const refresh = async () => {
    await cache.invalidateQueries({ queryKey: ["entries", pageId] });
    await onRefresh();
  };
  const updateCell = async (
    row: Row,
    property: Property,
    value: PropertyValue
  ) => {
    try {
      await client.databases.updateCell({
        pageId: row.id,
        propertyId: property.id,
        value,
        expectedRevision: row.values[property.id]?.revision ?? 0,
      });
      await refresh();
    } catch (e) {
      reportError(e);
      await cache.invalidateQueries({ queryKey: ["entries", pageId] });
    }
  };
  const add = async () => {
    setBusy(true);
    try {
      await client.databases.addEntry({ pageId, title: "Nouvelle page" });
      await refresh();
    } catch (e) {
      reportError(e);
    } finally {
      setBusy(false);
    }
  };
  const setConfig = (value: ViewConfig) => {
    setLocalConfig(value);
    setOffset(0);
  };
  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "title",
        header: "Nom",
        cell: ({ row }) => (
          <div className="entry-title">
            <button
              aria-label={`Ouvrir ${row.original.title}`}
              onClick={() => onNavigate(row.original.id)}
            >
              {row.original.icon}
            </button>
            {editable ? (
              <input
                aria-label={`Nom de ${row.original.title}`}
                defaultValue={row.original.title}
                key={row.original.title}
                onBlur={async (e) => {
                  if (e.target.value === row.original.title) {
                    return;
                  }
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
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
              />
            ) : (
              <span>{row.original.title}</span>
            )}
            <button
              aria-label={`Ouvrir la page ${row.original.title}`}
              className="open-entry"
              onClick={() => onNavigate(row.original.id)}
            >
              ↗
            </button>
          </div>
        ),
      },
      ...visible.map((property) => ({
        id: property.id,
        header: property.name,
        cell: ({ row }: { row: { original: Row } }) => (
          <PropertyCell
            editable={editable}
            key={`${row.original.id}:${property.id}:${row.original.values[property.id]?.revision ?? 0}`}
            members={members.data ?? []}
            onChange={(value) => void updateCell(row.original, property, value)}
            pageId={row.original.id}
            property={property}
            value={row.original.values[property.id]?.value ?? null}
          />
        ),
      })),
    ],
    [visible, editable, members.data, onNavigate]
  );
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
    enabled: config.layout === "table",
  });
  const virtualRows = virtual.getVirtualItems();
  const topPadding = virtualRows[0]?.start ?? 0;
  const bottomPadding = virtualRows.length
    ? virtual.getTotalSize() - virtualRows[virtualRows.length - 1]!.end
    : 0;
  if (metadata.isPending) {
    return <p className="muted">Ouverture de la base…</p>;
  }
  if (metadata.error) {
    return <p role="alert">{metadata.error.message}</p>;
  }
  return (
    <section aria-label="Base de données" className="database">
      <div className="database-tabs">
        {metadata.data?.views.map((view) => {
          const Icon =
            layouts.find((l) => l.id === view.config.layout)?.icon ?? Table2;
          return (
            <button
              className={view.id === selected?.id ? "active" : ""}
              key={view.id}
              onClick={() => {
                setViewId(view.id);
                setLocalConfig(null);
                setOffset(0);
              }}
            >
              <Icon size={14} />
              {view.name}
            </button>
          );
        })}
        {editable && (
          <button aria-label="Ajouter une vue" onClick={() => setPanel("view")}>
            <Plus size={14} />
          </button>
        )}
      </div>
      <div className="database-toolbar">
        <div className="database-search">
          <Search size={13} />
          <input
            aria-label="Rechercher dans la base"
            onChange={(e) => {
              setQuery(e.target.value);
              setOffset(0);
            }}
            placeholder="Rechercher…"
            value={query}
          />
        </div>
        <button
          aria-label="Filtres et tri"
          className="icon-button"
          onClick={() => setPanel("options")}
        >
          <SlidersHorizontal size={14} />
        </button>
        <button
          aria-label="Exporter les lignes affichées en CSV"
          className="icon-button"
          onClick={() => {
            const data = rows.map((row) =>
              Object.fromEntries([
                ["Nom", row.title],
                ...properties.map((p) => [
                  p.name,
                  displayValue(
                    p,
                    row.values[p.id]?.value ?? null,
                    members.data ?? []
                  ),
                ]),
              ])
            );
            download(
              "vue.csv",
              Papa.unparse(data, { escapeFormulae: true }),
              "text/csv;charset=utf-8"
            );
          }}
        >
          <FileDown size={14} />
        </button>
        {editable && (
          <Button disabled={busy} onClick={() => void add()} size="sm">
            <Plus size={13} />
            Nouveau
          </Button>
        )}
      </div>
      {localConfig && (
        <div className="view-unsaved">
          <span>Vue modifiée</span>
          {editable && (
            <button
              onClick={async () => {
                try {
                  if (!selected) {
                    return;
                  }
                  await client.databases.saveView({
                    pageId,
                    id: selected.id,
                    name: selected.name,
                    config,
                    expectedRevision: selected.revision,
                  });
                  await metadata.refetch();
                  setLocalConfig(null);
                } catch (e) {
                  reportError(e);
                }
              }}
            >
              Enregistrer la vue
            </button>
          )}
          <button onClick={() => setLocalConfig(null)}>Réinitialiser</button>
        </div>
      )}
      {rowsQuery.error && (
        <p className="form-error" role="alert">
          {rowsQuery.error.message}
        </p>
      )}
      {config.layout === "table" && (
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
                      <button
                        onClick={() =>
                          setConfig({
                            ...config,
                            sortBy: header.id,
                            sortDirection:
                              config.sortBy === header.id &&
                              config.sortDirection === "asc"
                                ? "desc"
                                : "asc",
                          })
                        }
                      >
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
                      <button onClick={() => setPanel("property")}>
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
                <tr aria-hidden="true">
                  <td
                    colSpan={columns.length + 1}
                    style={{ height: topPadding, padding: 0 }}
                  />
                </tr>
              )}
              {virtualRows.map((item) => {
                const row = tableRows[item.index]!;
                return (
                  <tr
                    data-index={item.index}
                    key={row.id}
                    ref={virtual.measureElement}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                    {editable && <td />}
                  </tr>
                );
              })}
              {bottomPadding > 0 && (
                <tr aria-hidden="true">
                  <td
                    colSpan={columns.length + 1}
                    style={{ height: bottomPadding, padding: 0 }}
                  />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {config.layout === "list" && (
        <div>
          {rows.map((row) => (
            <button
              className="database-list-row"
              key={row.id}
              onClick={() => onNavigate(row.id)}
            >
              <span>{row.icon}</span>
              <strong>{row.title}</strong>
              {visible.slice(0, 3).map((p) => (
                <span className="property-preview" key={p.id}>
                  {displayValue(
                    p,
                    row.values[p.id]?.value ?? null,
                    members.data ?? []
                  )}
                </span>
              ))}
              <ChevronRight size={14} />
            </button>
          ))}
        </div>
      )}
      {config.layout === "gallery" && (
        <div className="gallery-grid">
          {rows.map((row) => (
            <button
              className="gallery-card"
              key={row.id}
              onClick={() => onNavigate(row.id)}
            >
              <div className="gallery-cover">
                {row.cover ? (
                  <img alt="" src={row.cover} />
                ) : (
                  <span>{row.icon}</span>
                )}
              </div>
              <strong>{row.title}</strong>
              {visible.slice(0, 3).map((p) => (
                <span className="property-preview" key={p.id}>
                  {displayValue(
                    p,
                    row.values[p.id]?.value ?? null,
                    members.data ?? []
                  )}
                </span>
              ))}
            </button>
          ))}
        </div>
      )}
      {config.layout === "board" &&
        (groupProperty ? (
          <DragDropProvider
            onDragEnd={(event) => {
              if (event.canceled) {
                return;
              }
              const { source, target } = event.operation;
              const row = source?.data.row as Row | undefined;
              if (row && target && String(target.id).startsWith("group:")) {
                void updateCell(
                  row,
                  groupProperty,
                  String(target.id).slice(6) || null
                );
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
                  onChange={updateCell}
                  onNavigate={onNavigate}
                  pageId={pageId}
                  property={groupProperty}
                  query={query}
                />
              ))}
            </div>
          </DragDropProvider>
        ) : (
          <div className="empty-state py-10">
            <p>
              Ajoutez une propriété « Statut » ou « Sélection » pour organiser
              le tableau.
            </p>
            {editable && (
              <Button onClick={() => setPanel("property")}>
                Ajouter une propriété
              </Button>
            )}
          </div>
        ))}
      {config.layout === "calendar" && (
        <>
          <div className="calendar-header">
            <button
              aria-label="Mois précédent"
              className="icon-button"
              onClick={() => {
                setMonth((m) => addMonths(m, -1));
                setOffset(0);
              }}
            >
              <ChevronLeft size={15} />
            </button>
            <strong>{format(month, "MMMM yyyy", { locale: fr })}</strong>
            <button
              aria-label="Mois suivant"
              className="icon-button"
              onClick={() => {
                setMonth((m) => addMonths(m, 1));
                setOffset(0);
              }}
            >
              <ChevronRight size={15} />
            </button>
          </div>
          {dateProperty ? (
            <div className="calendar-grid">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                <div className="calendar-day-label" key={day}>
                  {day}
                </div>
              ))}
              {eachDayOfInterval(calendarRange).map((day) => (
                <div
                  className={`calendar-day ${isSameMonth(day, month) ? "" : "outside"}`}
                  key={day.toISOString()}
                >
                  <span>{format(day, "d")}</span>
                  {rows
                    .filter(
                      (row) =>
                        String(row.values[dateProperty.id]?.value ?? "").slice(
                          0,
                          10
                        ) === format(day, "yyyy-MM-dd")
                    )
                    .map((row) => (
                      <button key={row.id} onClick={() => onNavigate(row.id)}>
                        {row.icon} {row.title}
                      </button>
                    ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state py-10">
              <p>Ajoutez une propriété « Date » pour utiliser le calendrier.</p>
              {editable && (
                <Button onClick={() => setPanel("property")}>
                  Ajouter une propriété
                </Button>
              )}
            </div>
          )}
        </>
      )}
      {config.layout !== "board" && !rows.length && !rowsQuery.isFetching && (
        <p className="database-empty">
          Aucune entrée.{" "}
          {editable
            ? "Ajoutez votre première page."
            : "Aucune page ne correspond à cette vue."}
        </p>
      )}
      {config.layout !== "board" && (
        <div className="database-footer">
          <span>
            {rowsQuery.isFetching
              ? "Chargement…"
              : `${rows.length} entrée${rows.length > 1 ? "s" : ""} affichée${rows.length > 1 ? "s" : ""}`}
            {(offset > 0 || rowsQuery.data?.hasMore) && " · résultats paginés"}
          </span>
          <button
            aria-label="Résultats précédents"
            disabled={!offset}
            onClick={() => setOffset(Math.max(0, offset - 50))}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            aria-label="Résultats suivants"
            disabled={!rowsQuery.data?.hasMore}
            onClick={() => setOffset(offset + 50)}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
      <Dialog
        onOpenChange={(v) => {
          if (!v) {
            setPanel("none");
          }
        }}
        open={panel === "property"}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle propriété</DialogTitle>
            <DialogDescription>
              Ajoutez une information à toutes les pages de cette base.
            </DialogDescription>
          </DialogHeader>
          <PropertyForm
            onSubmit={async (values) => {
              await client.databases.addProperty({ pageId, ...values });
              await metadata.refetch();
              setPanel("none");
            }}
          />
        </DialogContent>
      </Dialog>
      <Dialog
        onOpenChange={(v) => {
          if (!v) {
            setPanel("none");
          }
        }}
        open={panel === "view"}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Une nouvelle perspective</DialogTitle>
            <DialogDescription>
              Les vues présentent les mêmes pages sous différentes formes.
            </DialogDescription>
          </DialogHeader>
          <form
            className="panel-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              try {
                const view = await client.databases.saveView({
                  pageId,
                  name: String(f.get("name")),
                  config: viewSchema.parse({ layout: f.get("layout") }),
                });
                await metadata.refetch();
                setViewId(view.id);
                setLocalConfig(null);
                setPanel("none");
              } catch (error) {
                reportError(error);
              }
            }}
          >
            <Input
              aria-label="Nom de la vue"
              maxLength={100}
              name="name"
              placeholder="Nom de la vue"
              required
            />
            <select aria-label="Disposition" name="layout">
              {layouts.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <Button>Créer la vue</Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        onOpenChange={(v) => {
          if (!v) {
            setPanel("none");
          }
        }}
        open={panel === "options"}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Options de la vue</DialogTitle>
            <DialogDescription>
              Filtrez, triez et choisissez les propriétés visibles.
            </DialogDescription>
          </DialogHeader>
          <div className="panel-form">
            <label>
              Trier par
              <select
                onChange={(e) =>
                  setConfig({ ...config, sortBy: e.target.value })
                }
                value={config.sortBy}
              >
                <option value="position">Ordre de création</option>
                <option value="title">Nom</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <select
              aria-label="Sens du tri"
              onChange={(e) =>
                setConfig({
                  ...config,
                  sortDirection: e.target.value === "desc" ? "desc" : "asc",
                })
              }
              value={config.sortDirection}
            >
              <option value="asc">Croissant</option>
              <option value="desc">Décroissant</option>
            </select>
            <label>
              Grouper / propriété du calendrier
              <select
                onChange={(e) =>
                  setConfig({ ...config, groupBy: e.target.value || undefined })
                }
                value={config.groupBy ?? ""}
              >
                <option value="">Automatique</option>
                {properties
                  .filter((p) => isChoiceType(p.type) || p.type === "date")
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </label>
            <div>
              <span className="muted text-xs">Propriétés visibles</span>
              {properties.map((p) => (
                <label className="mt-2 flex flex-row! gap-2!" key={p.id}>
                  <input
                    checked={!config.hidden.includes(p.id)}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        hidden: e.target.checked
                          ? config.hidden.filter((id) => id !== p.id)
                          : [...config.hidden, p.id],
                      })
                    }
                    type="checkbox"
                  />
                  {p.name}
                </label>
              ))}
            </div>
            <label>
              Filtres
              <select
                onChange={(e) =>
                  setConfig({
                    ...config,
                    filterMode: e.target.value === "or" ? "or" : "and",
                  })
                }
                value={config.filterMode}
              >
                <option value="and">Toutes les conditions</option>
                <option value="or">Au moins une condition</option>
              </select>
            </label>
            {config.filters.map((f, index) => (
              <div className="filter-row" key={index}>
                <select
                  aria-label="Propriété du filtre"
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      filters: config.filters.map((v, i) =>
                        i === index
                          ? {
                              ...v,
                              propertyId: e.target.value,
                              operator: "eq",
                              value: "",
                            }
                          : v
                      ),
                    })
                  }
                  value={f.propertyId}
                >
                  <option value="title">Nom</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Condition"
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      filters: config.filters.map((v, i) =>
                        i === index
                          ? {
                              ...v,
                              operator: e.target.value as typeof f.operator,
                            }
                          : v
                      ),
                    })
                  }
                  value={f.operator}
                >
                  {filterOperatorsFor(
                    properties.find((p) => p.id === f.propertyId)?.type ??
                      "text"
                  ).map((o) => (
                    <option key={o} value={o}>
                      {operatorLabels[o]}
                    </option>
                  ))}
                </select>
                <input
                  aria-label="Valeur du filtre"
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      filters: config.filters.map((v, i) =>
                        i === index ? { ...v, value: e.target.value } : v
                      ),
                    })
                  }
                  value={f.value}
                />
                <button
                  aria-label="Supprimer le filtre"
                  onClick={() =>
                    setConfig({
                      ...config,
                      filters: config.filters.filter((_, i) => i !== index),
                    })
                  }
                >
                  ×
                </button>
              </div>
            ))}
            <Button
              disabled={config.filters.length >= 20}
              onClick={() =>
                setConfig({
                  ...config,
                  filters: [
                    ...config.filters,
                    { propertyId: "title", operator: "contains", value: "" },
                  ],
                })
              }
              variant="outline"
            >
              <Plus size={13} />
              Ajouter un filtre
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
