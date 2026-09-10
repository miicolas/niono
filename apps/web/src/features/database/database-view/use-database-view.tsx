import { listWorkspacePeople } from "@/lib/organization";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import {
  viewSchema,
  type ViewConfig,
  type PropertyValue,
} from "@digipm/contracts";
import { client } from "@/lib/api";
import { reportError } from "@/lib/notifications";
import { useVisibleProperties } from "./use-visible-properties";
import { type Property, noProperties, noRows, type Row } from "./shared";
import { useDatabaseTable } from "./use-database-table";

export function useDatabaseView({
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
  const [filterRequest, setFilterRequest] = useState<{
    id: string;
    key: number;
    viewId?: string;
  } | null>(null);
  const [propertyAction, setPropertyAction] = useState<{
    property: Property;
    action: "rename" | "delete";
  } | null>(null);
  const [savingView, setSavingView] = useState(false);
  const [month, setMonth] = useState(new Date());
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setLocalConfig(null);
    setOffset(0);
  }, [viewId, pageId]);
  const selected =
    metadata.data?.views.find((v) => v.id === viewId) ??
    metadata.data?.views[0];
  const config = useMemo(
    () =>
      localConfig ?? viewSchema.parse(selected?.config ?? { layout: "table" }),
    [localConfig, selected?.config],
  );
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
    enabled:
      !!metadata.data && config.layout !== "board" && config.layout !== "chart",
  });
  const rows = rowsQuery.data?.rows ?? noRows;
  const { columnOrder, visible, visibleOrder } = useVisibleProperties(
    properties,
    config,
  );
  const members = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => listWorkspacePeople(workspaceId),
    enabled: properties.some((p) => p.type === "person"),
  });
  const refresh = useCallback(async () => {
    await cache.invalidateQueries({ queryKey: ["entries", pageId] });
    await onRefresh();
  }, [cache, pageId, onRefresh]);
  const updateCell = useCallback(
    async (row: Row, property: Property, value: PropertyValue) => {
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
    },
    [cache, pageId, refresh],
  );
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
  const {
    columns,
    table,
    tableScroll,
    tableRows,
    virtual,
    virtualRows,
    topPadding,
    bottomPadding,
  } = useDatabaseTable({
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
  });
  return {
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
  };
}
