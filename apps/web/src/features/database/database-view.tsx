import { useSearch, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import {
  Table2,
  Kanban,
  GalleryHorizontalEnd,
  List,
  CalendarDays,
  Plus,
  SlidersHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileDown,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  isSameMonth,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  viewSchema,
  type ViewConfig,
  type PropertyValue,
  type PropertyType,
} from "@digipm/contracts";
import { uploadFile } from "@/features/editor/upload";
import { client } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { reportError } from "@/lib/notifications";
import { download } from "@/lib/download";
import Papa from "papaparse";
type Database = Awaited<ReturnType<typeof client.databases.get>>;
type Property = Database["properties"][number];
type Row = Awaited<ReturnType<typeof client.databases.query>>["rows"][number];
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
    "none",
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
  const config =
    localConfig ?? selected?.config ?? viewSchema.parse({ layout: "table" });
  const properties = metadata.data?.properties ?? noProperties;
  const groupProperty =
    properties.find(
      (p) => p.id === config.groupBy && ["status", "select"].includes(p.type),
    ) ?? properties.find((p) => ["status", "select"].includes(p.type));
  const dateProperty =
    properties.find((p) => p.id === config.groupBy && p.type === "date") ??
    properties.find((p) => p.type === "date");
  const calendarScope =
    config.layout === "calendar" && dateProperty
      ? {
          propertyId: dateProperty.id,
          from: format(
            startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
            "yyyy-MM-dd",
          ),
          to: format(
            endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
            "yyyy-MM-dd",
          ),
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
    value: PropertyValue,
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
            <button
              className="open-entry"
              onClick={() => onNavigate(row.original.id)}
              aria-label={`Ouvrir la page ${row.original.title}`}
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
    [visible, editable, members.data, onNavigate],
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
  if (metadata.isPending) return <p className="muted">Ouverture de la base…</p>;
  if (metadata.error) return <p role="alert">{metadata.error.message}</p>;
  return (
    <section className="database" aria-label="Base de données">
      <div className="database-tabs">
        {metadata.data?.views.map((view) => {
          const Icon =
            layouts.find((l) => l.id === view.config.layout)?.icon ?? Table2;
          return (
            <button
              key={view.id}
              className={view.id === selected?.id ? "active" : ""}
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
            placeholder="Rechercher…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOffset(0);
            }}
          />
        </div>
        <button
          className="icon-button"
          aria-label="Filtres et tri"
          onClick={() => setPanel("options")}
        >
          <SlidersHorizontal size={14} />
        </button>
        <button
          className="icon-button"
          aria-label="Exporter les lignes affichées en CSV"
          onClick={() => {
            const data = rows.map((row) =>
              Object.fromEntries([
                ["Nom", row.title],
                ...properties.map((p) => [
                  p.name,
                  displayValue(
                    p,
                    row.values[p.id]?.value ?? null,
                    members.data ?? [],
                  ),
                ]),
              ]),
            );
            download(
              "vue.csv",
              Papa.unparse(data, { escapeFormulae: true }),
              "text/csv;charset=utf-8",
            );
          }}
        >
          <FileDown size={14} />
        </button>
        {editable && (
          <Button size="sm" onClick={() => void add()} disabled={busy}>
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
                  if (!selected) return;
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
        <p role="alert" className="form-error">
          {rowsQuery.error.message}
        </p>
      )}
      {config.layout === "table" && (
        <div
          ref={tableScroll}
          className="database-table-scroll"
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
                          header.getContext(),
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
                    key={row.id}
                    data-index={item.index}
                    ref={virtual.measureElement}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
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
              key={row.id}
              className="database-list-row"
              onClick={() => onNavigate(row.id)}
            >
              <span>{row.icon}</span>
              <strong>{row.title}</strong>
              {visible.slice(0, 3).map((p) => (
                <span className="property-preview" key={p.id}>
                  {displayValue(
                    p,
                    row.values[p.id]?.value ?? null,
                    members.data ?? [],
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
                  <img src={row.cover} alt="" />
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
                    members.data ?? [],
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
              className="icon-button"
              aria-label="Mois précédent"
              onClick={() => {
                setMonth((m) => addMonths(m, -1));
                setOffset(0);
              }}
            >
              <ChevronLeft size={15} />
            </button>
            <strong>{format(month, "MMMM yyyy", { locale: fr })}</strong>
            <button
              className="icon-button"
              aria-label="Mois suivant"
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
              {eachDayOfInterval({
                start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
                end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
              }).map((day) => (
                <div
                  key={day.toISOString()}
                  className={`calendar-day ${isSameMonth(day, month) ? "" : "outside"}`}
                >
                  <span>{format(day, "d")}</span>
                  {rows
                    .filter(
                      (row) =>
                        String(row.values[dateProperty.id]?.value ?? "").slice(
                          0,
                          10,
                        ) === format(day, "yyyy-MM-dd"),
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
            disabled={!offset}
            onClick={() => setOffset(Math.max(0, offset - 50))}
            aria-label="Résultats précédents"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            disabled={!rowsQuery.data?.hasMore}
            onClick={() => setOffset(offset + 50)}
            aria-label="Résultats suivants"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
      <Dialog
        open={panel === "property"}
        onOpenChange={(v) => {
          if (!v) setPanel("none");
        }}
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
        open={panel === "view"}
        onOpenChange={(v) => {
          if (!v) setPanel("none");
        }}
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
              name="name"
              placeholder="Nom de la vue"
              aria-label="Nom de la vue"
              required
              maxLength={100}
            />
            <select name="layout" aria-label="Disposition">
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
        open={panel === "options"}
        onOpenChange={(v) => {
          if (!v) setPanel("none");
        }}
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
                value={config.sortBy}
                onChange={(e) =>
                  setConfig({ ...config, sortBy: e.target.value })
                }
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
              value={config.sortDirection}
              onChange={(e) =>
                setConfig({
                  ...config,
                  sortDirection: e.target.value === "desc" ? "desc" : "asc",
                })
              }
            >
              <option value="asc">Croissant</option>
              <option value="desc">Décroissant</option>
            </select>
            <label>
              Grouper / propriété du calendrier
              <select
                value={config.groupBy ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, groupBy: e.target.value || undefined })
                }
              >
                <option value="">Automatique</option>
                {properties
                  .filter((p) => ["status", "select", "date"].includes(p.type))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </label>
            <div>
              <span className="text-xs muted">Propriétés visibles</span>
              {properties.map((p) => (
                <label key={p.id} className="flex-row! flex gap-2! mt-2">
                  <input
                    type="checkbox"
                    checked={!config.hidden.includes(p.id)}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        hidden: e.target.checked
                          ? config.hidden.filter((id) => id !== p.id)
                          : [...config.hidden, p.id],
                      })
                    }
                  />
                  {p.name}
                </label>
              ))}
            </div>
            <label>
              Filtres
              <select
                value={config.filterMode}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    filterMode: e.target.value === "or" ? "or" : "and",
                  })
                }
              >
                <option value="and">Toutes les conditions</option>
                <option value="or">Au moins une condition</option>
              </select>
            </label>
            {config.filters.map((f, index) => (
              <div key={index} className="filter-row">
                <select
                  aria-label="Propriété du filtre"
                  value={f.propertyId}
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
                          : v,
                      ),
                    })
                  }
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
                  value={f.operator}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      filters: config.filters.map((v, i) =>
                        i === index
                          ? {
                              ...v,
                              operator: e.target.value as typeof f.operator,
                            }
                          : v,
                      ),
                    })
                  }
                >
                  {[
                    { id: "contains", name: "contient" },
                    { id: "eq", name: "est égal à" },
                    { id: "neq", name: "différent de" },
                    { id: "gt", name: "supérieur à" },
                    { id: "lt", name: "inférieur à" },
                    { id: "empty", name: "est vide" },
                  ]
                    .filter((o) => {
                      const type =
                        properties.find((p) => p.id === f.propertyId)?.type ??
                        "text";
                      if (o.id === "empty" || o.id === "eq" || o.id === "neq")
                        return true;
                      if (o.id === "gt" || o.id === "lt")
                        return ["number", "date"].includes(type);
                      return ![
                        "number",
                        "date",
                        "checkbox",
                        "select",
                        "status",
                      ].includes(type);
                    })
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                </select>
                <input
                  aria-label="Valeur du filtre"
                  value={f.value}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      filters: config.filters.map((v, i) =>
                        i === index ? { ...v, value: e.target.value } : v,
                      ),
                    })
                  }
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
              variant="outline"
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
function PropertyForm({
  onSubmit,
}: {
  onSubmit: (values: {
    name: string;
    type: PropertyType;
    options: { id: string; name: string; color: string }[];
  }) => Promise<void>;
}) {
  const [type, setType] = useState<PropertyType>("text");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="panel-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        try {
          await onSubmit({
            name: String(f.get("name")),
            type,
            options: ["select", "multiSelect", "status"].includes(type)
              ? String(f.get("options"))
                  .split(",")
                  .map((n) => n.trim())
                  .filter(Boolean)
                  .map((name) => ({
                    id: crypto.randomUUID(),
                    name,
                    color: "gray",
                  }))
              : [],
          });
        } catch (error) {
          reportError(error);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Input
        aria-label="Nom de la propriété"
        name="name"
        placeholder="Nom de la propriété"
        required
        maxLength={100}
      />
      <select
        aria-label="Type de propriété"
        value={type}
        onChange={(e) => setType(e.target.value as PropertyType)}
      >
        {[
          { id: "text", name: "Texte" },
          { id: "number", name: "Nombre" },
          { id: "checkbox", name: "Case à cocher" },
          { id: "select", name: "Sélection" },
          { id: "multiSelect", name: "Sélection multiple" },
          { id: "status", name: "Statut" },
          { id: "date", name: "Date" },
          { id: "person", name: "Personnes" },
          { id: "url", name: "URL" },
          { id: "email", name: "Email" },
          { id: "files", name: "Fichiers" },
        ].map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      {["select", "multiSelect", "status"].includes(type) && (
        <label>
          Options séparées par des virgules
          <Input
            name="options"
            placeholder="À faire, En cours, Terminé"
            required
          />
        </label>
      )}
      <Button disabled={busy}>Ajouter la propriété</Button>
    </form>
  );
}
function PropertyCell({
  pageId,
  property,
  value,
  editable,
  members,
  onChange,
}: {
  pageId: string;
  property: Property;
  value: PropertyValue;
  editable: boolean;
  members: Awaited<ReturnType<typeof client.workspace.members>>;
  onChange: (value: PropertyValue) => void;
}) {
  const [draft, setDraft] = useState(
    typeof value === "string" || typeof value === "number" ? String(value) : "",
  );
  if (property.type === "files")
    return (
      <div className="cell-files">
        {(Array.isArray(value) ? value : []).map((id, i) => (
          <span key={id}>
            <a href={`/api/assets/${id}`} target="_blank" rel="noreferrer">
              Fichier {i + 1}
            </a>
            {editable && (
              <button
                aria-label={`Retirer le fichier ${i + 1}`}
                onClick={() =>
                  onChange(
                    (Array.isArray(value) ? value : []).filter((v) => v !== id),
                  )
                }
              >
                ×
              </button>
            )}
          </span>
        ))}
        {editable && (
          <label className="file-cell-upload">
            Ajouter
            <input
              type="file"
              aria-label={`Ajouter un fichier à ${property.name}`}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                e.target.value = "";
                try {
                  const asset = await uploadFile(pageId, file);
                  onChange([...(Array.isArray(value) ? value : []), asset.id]);
                } catch (error) {
                  reportError(error);
                }
              }}
            />
          </label>
        )}
      </div>
    );
  if (!editable)
    return (
      <span className="cell-value">
        {displayValue(property, value, members)}
      </span>
    );
  if (property.type === "checkbox")
    return (
      <input
        type="checkbox"
        aria-label={property.name}
        checked={value === true}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  if (property.type === "select" || property.type === "status")
    return (
      <select
        aria-label={property.name}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">—</option>
        {property.options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    );
  if (property.type === "multiSelect" || property.type === "person") {
    const options =
      property.type === "person"
        ? members.map((m) => ({ id: m.id, name: m.name }))
        : property.options;
    return (
      <details className="cell-multi">
        <summary>{displayValue(property, value, members) || "—"}</summary>
        <div>
          {options.map((o) => (
            <label key={o.id}>
              <input
                type="checkbox"
                checked={Array.isArray(value) && value.includes(o.id)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...(Array.isArray(value) ? value : []), o.id]
                      : (Array.isArray(value) ? value : []).filter(
                          (id) => id !== o.id,
                        ),
                  )
                }
              />
              {o.name}
            </label>
          ))}
        </div>
      </details>
    );
  }
  return (
    <input
      aria-label={property.name}
      type={
        ["number", "date", "email", "url"].includes(property.type)
          ? property.type
          : "text"
      }
      step={property.type === "number" ? "any" : undefined}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const next =
          draft === ""
            ? null
            : property.type === "number"
              ? Number(draft)
              : draft;
        if (next !== value) onChange(next);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}
function displayValue(
  property: Property,
  value: PropertyValue,
  members: Awaited<ReturnType<typeof client.workspace.members>>,
) {
  if (value === null) return "";
  if (typeof value === "boolean") return value ? "✓" : "";
  if (Array.isArray(value))
    return value
      .map((id) =>
        property.type === "person"
          ? (members.find((m) => m.id === id)?.name ?? id)
          : (property.options.find((o) => o.id === id)?.name ?? id),
      )
      .join(", ");
  return property.options.find((o) => o.id === value)?.name ?? String(value);
}
function BoardColumn({
  id,
  name,
  pageId,
  property,
  config,
  query,
  onChange,
  editable,
  onNavigate,
}: {
  id: string;
  name: string;
  pageId: string;
  property: Property;
  config: ViewConfig;
  query: string;
  onChange: (
    row: Row,
    property: Property,
    value: PropertyValue,
  ) => Promise<void>;
  editable: boolean;
  onNavigate: (id: string) => void;
}) {
  const results = useInfiniteQuery({
    queryKey: ["entries", pageId, "group", id, property.id, config, query],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      client.databases.query({
        pageId,
        config,
        query,
        offset: pageParam,
        limit: 50,
        scope: { propertyId: property.id, value: id || null },
      }),
    getNextPageParam: (last) => (last.hasMore ? last.nextOffset : undefined),
  });
  const rows = results.data?.pages.flatMap((p) => p.rows) ?? [];
  const { ref, isDropTarget } = useDroppable({
    id: `group:${id}`,
    disabled: !editable,
  });
  return (
    <div
      ref={ref}
      className={`board-column ${isDropTarget ? "drop-target" : ""}`}
    >
      <header>
        <span>{name}</span>
        <small>{rows.length}</small>
      </header>
      {rows.map((row) => (
        <BoardCard
          key={row.id}
          row={row}
          editable={editable}
          onNavigate={onNavigate}
          property={property}
          onChange={(value) => void onChange(row, property, value)}
        />
      ))}
      {results.error && <p role="alert">{results.error.message}</p>}
      {results.hasNextPage && (
        <Button
          variant="ghost"
          disabled={results.isFetchingNextPage}
          onClick={() => void results.fetchNextPage()}
        >
          Charger plus
        </Button>
      )}
    </div>
  );
}
function BoardCard({
  row,
  editable,
  onNavigate,
  property,
  onChange,
}: {
  row: Row;
  property: Property;
  onChange: (value: PropertyValue) => void;
  editable: boolean;
  onNavigate: (id: string) => void;
}) {
  const { ref, handleRef, isDragging } = useDraggable({
    id: row.id,
    data: { row },
    disabled: !editable,
  });
  return (
    <div ref={ref} className={`board-card ${isDragging ? "dragging" : ""}`}>
      <button
        ref={handleRef}
        aria-label={`Déplacer ${row.title}`}
        className="board-grip"
        disabled={!editable}
      >
        ⠿
      </button>
      <button onClick={() => onNavigate(row.id)}>
        {row.icon}
        <strong>{row.title}</strong>
      </button>
      {editable && (
        <select
          aria-label={`Statut de ${row.title}`}
          value={String(row.values[property.id]?.value ?? "")}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">Sans statut</option>
          {property.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
