import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { orpcClient } from "@/orpc/client";
import { defaultViewConfig, type ViewConfig } from "@/validators/databases";
import { DatabaseFooter } from "./database-footer";
import { DatabaseLayout } from "./database-layout";
import { DatabaseToolbar } from "./database-toolbar";
import { exportViewCsv } from "./export-view-csv";
import { NewPropertyDialog } from "./new-property-dialog";
import { NewViewDialog } from "./new-view-dialog";
import type { Database, Members, Property } from "./types";
import { UnsavedViewBanner } from "./unsaved-view-banner";
import { useDatabaseColumns } from "./use-database-columns";
import { useDatabaseRows } from "./use-database-rows";
import { useEntryActions } from "./use-entry-actions";
import { ViewOptionsDialog } from "./view-options-dialog";
import { ViewTabs } from "./view-tabs";

const noProperties: Property[] = [];
const noViews: Database["views"] = [];
const noMembers: Members = [];
type Panel = "none" | "property" | "view" | "options";
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
  const metadata = useQuery({
    queryKey: ["database", pageId],
    queryFn: () => orpcClient.databases.get({ id: pageId }),
  });
  const routeSearch = useSearch({ from: "/(application)/" });
  const navigate = useNavigate();
  const viewId = routeSearch.view;
  const setViewId = (id: string) =>
    navigate({ to: "/", search: (prev) => ({ ...prev, view: id }) });
  const [localConfig, setLocalConfig] = useState<ViewConfig | null>(null);
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [panel, setPanel] = useState<Panel>("none");
  const [month, setMonth] = useState(new Date());
  const [seenViewId, setSeenViewId] = useState(viewId);
  if (seenViewId !== viewId) {
    setSeenViewId(viewId);
    setLocalConfig(null);
    setOffset(0);
  }
  const views = metadata.data?.views ?? noViews;
  const selected = views.find((v) => v.id === viewId) ?? views[0];
  const config = localConfig ?? selected?.config ?? defaultViewConfig;
  const properties = metadata.data?.properties ?? noProperties;
  const { rowsQuery, rows, dateProperty, calendarRange } = useDatabaseRows({
    pageId,
    config,
    query,
    offset,
    month,
    properties,
    enabled: !!metadata.data,
  });
  const visible = properties.filter((p) => !config.hidden.includes(p.id));
  const membersQuery = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => orpcClient.workspaces.members({ workspaceId }),
    enabled: properties.some((p) => p.type === "person"),
  });
  const members = membersQuery.data ?? noMembers;
  const { refresh, updateCell, add, busy } = useEntryActions({
    pageId,
    onRefresh,
  });
  const setConfig = (value: ViewConfig) => {
    setLocalConfig(value);
    setOffset(0);
  };
  const columns = useDatabaseColumns({
    visible,
    editable,
    members,
    onNavigate,
    onRefresh: refresh,
    onCellChange: updateCell,
  });
  const closePanel = () => setPanel("none");
  const openProperty = () => setPanel("property");
  const paginated = config.layout !== "board";
  if (metadata.isPending) {
    return <p className="muted">Ouverture de la base…</p>;
  }
  if (metadata.error) {
    return <p role="alert">{metadata.error.message}</p>;
  }
  return (
    <section aria-label="Base de données" className="database">
      <ViewTabs
        editable={editable}
        onAdd={() => setPanel("view")}
        onSelect={(id) => {
          setViewId(id);
          setLocalConfig(null);
          setOffset(0);
        }}
        selectedId={selected?.id}
        views={views}
      />
      <DatabaseToolbar
        busy={busy}
        editable={editable}
        onAdd={add}
        onExport={() => exportViewCsv(rows, properties, members)}
        onOpenOptions={() => setPanel("options")}
        onQueryChange={(value) => {
          setQuery(value);
          setOffset(0);
        }}
        query={query}
      />
      {localConfig && (
        <UnsavedViewBanner
          config={config}
          editable={editable}
          onReset={() => setLocalConfig(null)}
          onSaved={async () => {
            await metadata.refetch();
            setLocalConfig(null);
          }}
          pageId={pageId}
          view={selected}
        />
      )}
      {rowsQuery.error && (
        <p className="form-error" role="alert">
          {rowsQuery.error.message}
        </p>
      )}
      <DatabaseLayout
        calendarRange={calendarRange}
        columns={columns}
        config={config}
        dateProperty={dateProperty}
        editable={editable}
        members={members}
        month={month}
        onAddProperty={openProperty}
        onCellChange={updateCell}
        onMonthChange={(next) => {
          setMonth(next);
          setOffset(0);
        }}
        onNavigate={onNavigate}
        pageId={pageId}
        properties={properties}
        query={query}
        rows={rows}
        setConfig={setConfig}
        visible={visible}
      />
      {paginated && !rows.length && !rowsQuery.isFetching && (
        <p className="database-empty">
          Aucune entrée.{" "}
          {editable
            ? "Ajoutez votre première page."
            : "Aucune page ne correspond à cette vue."}
        </p>
      )}
      {paginated && (
        <DatabaseFooter
          count={rows.length}
          fetching={rowsQuery.isFetching}
          hasMore={rowsQuery.data?.hasMore}
          offset={offset}
          onOffsetChange={setOffset}
        />
      )}
      <NewPropertyDialog
        onAdded={() => metadata.refetch()}
        onClose={closePanel}
        open={panel === "property"}
        pageId={pageId}
      />
      <NewViewDialog
        onClose={closePanel}
        onCreated={async (id) => {
          await metadata.refetch();
          await setViewId(id);
          setLocalConfig(null);
          setPanel("none");
        }}
        open={panel === "view"}
        pageId={pageId}
      />
      <ViewOptionsDialog
        config={config}
        onClose={closePanel}
        open={panel === "options"}
        properties={properties}
        setConfig={setConfig}
      />
    </section>
  );
}
