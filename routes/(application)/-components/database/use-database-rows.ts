import { useQuery } from "@tanstack/react-query";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { orpcClient } from "@/orpc/client";
import type { ViewConfig } from "@/validators/databases";
import type { Property, Row } from "./types";

const noRows: Row[] = [];
export function useDatabaseRows({
  pageId,
  config,
  query,
  offset,
  month,
  properties,
  enabled,
}: {
  pageId: string;
  config: ViewConfig;
  query: string;
  offset: number;
  month: Date;
  properties: Property[];
  enabled: boolean;
}) {
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
      orpcClient.databases.query({
        pageId,
        config,
        query,
        offset,
        limit: 50,
        scope: calendarScope,
      }),
    enabled: enabled && config.layout !== "board",
  });
  return {
    rowsQuery,
    rows: rowsQuery.data?.rows ?? noRows,
    dateProperty,
    calendarRange,
  };
}
