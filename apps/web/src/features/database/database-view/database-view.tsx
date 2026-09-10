import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ContentState, RequestError } from "@/components/content-state";
import { DatabaseSkeleton, ListSkeleton } from "@/components/loading-state";
import { Suspense } from "react";
import { Table2, Search } from "lucide-react";
import { type DatabaseViewProps, ChartView } from "./shared";
import { useDatabaseView } from "./use-database-view";
import { DatabaseToolbar } from "./database-toolbar";
import { DatabaseUnsavedView } from "./database-unsaved-view";
import { DatabaseTable } from "./database-table";
import { DatabaseList } from "./database-list";
import { DatabaseGallery } from "./database-gallery";
import { DatabaseBoard } from "./database-board";
import { DatabaseCalendar } from "./database-calendar";
import { CreateViewDialog } from "./create-view-dialog";
import { ViewOptionsDialog } from "./view-options-dialog";
import { PropertyActionDialog } from "./property-action-dialog";
import { DatabaseTabs } from "./database-tabs";
import { DatabasePagination } from "./database-pagination";
import { CreatePropertyDialog } from "./create-property-dialog";

export function DatabaseView(props: DatabaseViewProps) {
  const {
    metadata,
    selected,
    setViewId,
    setLocalConfig,
    setOffset,
    editable,
    setPanel,
    query,
    setQuery,
    config,
    pageId,
    properties,
    members,
    setConfig,
    filterRequest,
    rows,
    add,
    busy,
    localConfig,
    savingView,
    setSavingView,
    rowsQuery,
    onNavigate,
    visibleOrder,
    columnOrder,
    tableScroll,
    table,
    setFilterRequest,
    setPropertyAction,
    columns,
    topPadding,
    virtualRows,
    tableRows,
    virtual,
    bottomPadding,
    visible,
    groupProperty,
    updateCell,
    setMonth,
    month,
    dateProperty,
    offset,
    panel,
    propertyAction,
    setBusy,
    refresh,
  } = useDatabaseView(props);
  if (metadata.isPending && metadata.fetchStatus !== "paused")
    return <DatabaseSkeleton />;
  if (!metadata.data)
    return (
      <RequestError
        compact
        error={metadata.error}
        title="Impossible d’ouvrir la base"
        description="Les vues et les propriétés n’ont pas pu être chargées. Réessayez pour continuer."
        onRetry={() => void metadata.refetch()}
        retrying={metadata.isFetching}
      />
    );
  return (
    <Tabs
      value={selected?.id ?? ""}
      onValueChange={(id) => {
        setViewId(id);
        setLocalConfig(null);
        setOffset(0);
      }}
      asChild
    >
      <section className="database" aria-label="Base de données">
        <DatabaseTabs
          metadata={metadata}
          editable={editable}
          setPanel={setPanel}
        />
        <TabsContent value={selected?.id ?? ""} className="min-w-0">
          <DatabaseToolbar
            query={query}
            setQuery={setQuery}
            setOffset={setOffset}
            config={config}
            pageId={pageId}
            selected={selected}
            properties={properties}
            members={members}
            setConfig={setConfig}
            editable={editable}
            setPanel={setPanel}
            filterRequest={filterRequest}
            rows={rows}
            add={add}
            busy={busy}
          />
          <DatabaseUnsavedView
            localConfig={localConfig}
            editable={editable}
            savingView={savingView}
            selected={selected}
            config={config}
            setSavingView={setSavingView}
            pageId={pageId}
            metadata={metadata}
            setLocalConfig={setLocalConfig}
            setOffset={setOffset}
          />
          {config.layout !== "chart" &&
            config.layout !== "board" &&
            (rowsQuery.error ||
              (!rowsQuery.data && rowsQuery.fetchStatus === "paused")) && (
              <RequestError
                compact
                error={rowsQuery.error}
                title="Impossible de charger les entrées"
                description="Relancez le chargement pour afficher les pages de cette vue."
                onRetry={() => void rowsQuery.refetch()}
                retrying={rowsQuery.isFetching}
              />
            )}
          {(config.layout === "list" ||
            config.layout === "gallery" ||
            config.layout === "calendar") &&
            rowsQuery.isPending &&
            rowsQuery.fetchStatus !== "paused" && (
              <ListSkeleton label="Chargement des entrées…" />
            )}
          {config.layout === "chart" && (
            <Suspense fallback={<p role="status">Chargement du graphique…</p>}>
              <ChartView
                key={`${pageId}:${selected?.id}`}
                pageId={pageId}
                config={config}
                properties={properties}
                query={query}
                name={selected?.name ?? "Graphique"}
                onChange={setConfig}
                onNavigate={onNavigate}
              />
            </Suspense>
          )}
          <DatabaseTable
            config={config}
            visibleOrder={visibleOrder}
            setConfig={setConfig}
            columnOrder={columnOrder}
            tableScroll={tableScroll}
            table={table}
            editable={editable}
            properties={properties}
            setFilterRequest={setFilterRequest}
            selected={selected}
            setPropertyAction={setPropertyAction}
            setPanel={setPanel}
            rowsQuery={rowsQuery}
            columns={columns}
            rows={rows}
            query={query}
            topPadding={topPadding}
            virtualRows={virtualRows}
            tableRows={tableRows}
            virtual={virtual}
            bottomPadding={bottomPadding}
          />
          <DatabaseList
            config={config}
            rows={rows}
            onNavigate={onNavigate}
            visible={visible}
            members={members}
          />
          <DatabaseGallery
            config={config}
            rows={rows}
            onNavigate={onNavigate}
            visible={visible}
            members={members}
          />
          <DatabaseBoard
            config={config}
            groupProperty={groupProperty}
            updateCell={updateCell}
            pageId={pageId}
            query={query}
            editable={editable}
            onNavigate={onNavigate}
            setPanel={setPanel}
          />
          <DatabaseCalendar
            config={config}
            setMonth={setMonth}
            setOffset={setOffset}
            month={month}
            dateProperty={dateProperty}
            rows={rows}
            onNavigate={onNavigate}
            editable={editable}
            setPanel={setPanel}
          />
          {config.layout !== "board" &&
            config.layout !== "chart" &&
            config.layout !== "table" &&
            (config.layout !== "calendar" || dateProperty) &&
            !rows.length &&
            !rowsQuery.isPending &&
            !rowsQuery.isFetching &&
            !rowsQuery.error && (
              <ContentState
                compact
                icon={config.filters.length || query ? Search : Table2}
                title={
                  config.filters.length || query
                    ? "Aucun résultat dans cette vue"
                    : "Aucune page dans cette vue"
                }
                description={
                  config.filters.length || query
                    ? "Modifiez votre recherche ou vos filtres pour retrouver vos pages."
                    : editable
                      ? "Ajoutez une première page pour commencer."
                      : "Les pages ajoutées à cette vue apparaîtront ici."
                }
              />
            )}
          <DatabasePagination
            config={config}
            rowsQuery={rowsQuery}
            rows={rows}
            offset={offset}
            setOffset={setOffset}
          />
          <CreatePropertyDialog
            panel={panel}
            setPanel={setPanel}
            pageId={pageId}
            metadata={metadata}
          />
          <CreateViewDialog
            panel={panel}
            setPanel={setPanel}
            pageId={pageId}
            properties={properties}
            metadata={metadata}
            setViewId={setViewId}
            setLocalConfig={setLocalConfig}
          />
          <ViewOptionsDialog
            panel={panel}
            setPanel={setPanel}
            config={config}
            setConfig={setConfig}
            properties={properties}
          />
          <PropertyActionDialog
            propertyAction={propertyAction}
            busy={busy}
            setPropertyAction={setPropertyAction}
            setBusy={setBusy}
            pageId={pageId}
            setLocalConfig={setLocalConfig}
            metadata={metadata}
            refresh={refresh}
          />
        </TabsContent>
      </section>
    </Tabs>
  );
}
