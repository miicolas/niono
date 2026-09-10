import { type ViewConfig } from "./view-config";

export function withoutProperty(
  config: ViewConfig,
  propertyId: string,
): ViewConfig {
  const { [propertyId]: removed, ...columnWidths } = config.columnWidths;
  return {
    ...config,
    columnWidths,
    columnOrder: config.columnOrder.filter((id) => id !== propertyId),
    hidden: config.hidden.filter((id) => id !== propertyId),
    filters: config.filters.filter((f) => f.propertyId !== propertyId),
    sorts: config.sorts.filter((s) => s.propertyId !== propertyId),
    sortBy: config.sortBy === propertyId ? "position" : config.sortBy,
    groupBy: config.groupBy === propertyId ? undefined : config.groupBy,
    chart: config.chart && {
      ...config.chart,
      xProperty:
        config.chart.xProperty === propertyId
          ? "title"
          : config.chart.xProperty,
      ...(config.chart.metricProperty === propertyId
        ? { metricProperty: undefined, aggregation: "count" }
        : {}),
    },
  };
}
