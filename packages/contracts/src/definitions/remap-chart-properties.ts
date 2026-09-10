import { type ChartConfig } from "./chart-config";

export function remapChartProperties(
  chart: ChartConfig | undefined,
  ids: ReadonlyMap<string, string>,
): ChartConfig | undefined {
  return (
    chart && {
      ...chart,
      xProperty: ids.get(chart.xProperty) ?? chart.xProperty,
      metricProperty: chart.metricProperty
        ? (ids.get(chart.metricProperty) ?? chart.metricProperty)
        : undefined,
    }
  );
}
