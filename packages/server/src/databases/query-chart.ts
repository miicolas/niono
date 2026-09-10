import { db, schema as s } from "@digipm/db";
import { eq, sql, asc } from "drizzle-orm";
import { entryQuery, type EntryQuery } from "./entry-query";
import { validateChart } from "./chart-config";
import { chartGrouping } from "./chart-grouping";

export async function queryChart(
  userId: string,
  input: Pick<EntryQuery, "pageId" | "config" | "query">,
) {
  const { config, properties, expr, where } = await entryQuery(userId, input);
  const chart = validateChart(config, properties);
  const source = db
    .select({
      bucket: chartGrouping(chart, properties, expr).as("bucket"),
      metric: (chart.aggregation === "count"
        ? sql<number>`1`
        : expr(chart.metricProperty!)
      ).as("metric"),
    })
    .from(s.entries)
    .innerJoin(s.pages, eq(s.pages.id, s.entries.pageId))
    .where(where)
    .as("chart_entries");
  const aggregation =
    chart.aggregation === "count"
      ? sql`count(*)`
      : chart.aggregation === "sum"
        ? sql`sum(${source.metric})`
        : chart.aggregation === "average"
          ? sql`avg(${source.metric})`
          : chart.aggregation === "min"
            ? sql`min(${source.metric})`
            : sql`max(${source.metric})`;
  const category = properties.find((p) => p.id === chart.xProperty);
  const categoryOrder =
    category?.type === "number"
      ? sql`CAST(${source.bucket} AS double precision)`
      : category?.options.length
        ? sql`coalesce(CASE ${source.bucket} ${sql.join(
            category.options.map(
              (option) => sql`WHEN ${option.id} THEN ${option.name}`,
            ),
            sql` `,
          )} END, ${source.bucket})`
        : sql`${source.bucket}`;
  const order =
    chart.sort === "valueAsc"
      ? sql`${aggregation} ASC NULLS LAST`
      : chart.sort === "valueDesc"
        ? sql`${aggregation} DESC NULLS LAST`
        : chart.sort === "categoryDesc"
          ? sql`${categoryOrder} DESC NULLS LAST`
          : sql`${categoryOrder} ASC NULLS LAST`;
  const result = await db
    .select({
      key: source.bucket,
      value: sql<number | null>`${aggregation}`.mapWith(Number),
      count: sql<number>`count(*)`.mapWith(Number),
      totalEntries: sql<number>`sum(count(*)) over ()`.mapWith(Number),
      totalGroups: sql<number>`count(*) over ()`.mapWith(Number),
    })
    .from(source)
    .groupBy(source.bucket)
    .orderBy(order, asc(source.bucket))
    .limit(200);
  return {
    groups: result.map((row) => ({
      key: row.key,
      label:
        row.key === null
          ? "Sans valeur"
          : category?.type === "checkbox"
            ? row.key === "true"
              ? "Coché"
              : "Non coché"
            : (category?.options.find((o) => o.id === row.key)?.name ??
              row.key),
      value: row.value,
      count: row.count,
    })),
    totalEntries: result[0]?.totalEntries ?? 0,
    totalGroups: result[0]?.totalGroups ?? 0,
  };
}
