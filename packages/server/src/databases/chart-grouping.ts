import type { ChartConfig } from "@digipm/contracts";
import { schema as s } from "@digipm/db";
import { sql, type SQL } from "drizzle-orm";
type Property = typeof s.properties.$inferSelect;

export function chartGrouping(
  chart: ChartConfig,
  properties: Property[],
  expr: (id: string) => SQL,
) {
  const value = expr(chart.xProperty);
  const property = properties.find((p) => p.id === chart.xProperty);
  return property?.type === "date"
    ? sql<
        string | null
      >`to_char(date_trunc(${chart.dateBucket}, CAST(${value} AS timestamp)), 'YYYY-MM-DD')`
    : sql<string | null>`nullif(CAST(${value} AS text), '')`;
}
