import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { visibleTo } from "@/server/services/access/visible-pages";
import type { ViewConfig } from "@/validators/databases";
import { compileFilter } from "./compile-filter";
import { compileScope, type EntryScope } from "./compile-scope";
import { containsPattern } from "./escape-like";
import { propertyExpression } from "./property-expression";
import { valueFrom } from "./property-values";
import { sourceFor } from "./source-for";

/** Liste paginée des entrées visibles d'une base selon la configuration d'une vue. */
export async function queryEntries(
  userId: string,
  input: {
    pageId: string;
    config: ViewConfig;
    offset: number;
    limit: number;
    query?: string;
    scope?: EntryScope;
  }
) {
  const source = await sourceFor(userId, input.pageId);
  const properties = await db
    .select()
    .from(s.properties)
    .where(eq(s.properties.sourceId, source.id));
  const filters = input.config.filters.map((filter) =>
    compileFilter(properties, filter)
  );
  const combinedFilters =
    input.config.filterMode === "or" ? or(...filters) : and(...filters);
  const where = and(
    compileScope(properties, input.scope),
    eq(s.entries.sourceId, source.id),
    sql`${s.pages.deletedAt} IS NULL`,
    visibleTo(userId, "pages"),
    input.query
      ? sql`${s.pages.title} ILIKE ${containsPattern(input.query)}`
      : undefined,
    filters.length ? combinedFilters : undefined
  );
  const order =
    input.config.sortBy === "position"
      ? sql`${s.entries.position}`
      : propertyExpression(properties, input.config.sortBy);
  const list = await db
    .select({
      id: s.pages.id,
      title: s.pages.title,
      icon: s.pages.icon,
      cover: s.pages.cover,
      revision: s.pages.revision,
      createdAt: s.pages.createdAt,
      updatedAt: s.pages.updatedAt,
    })
    .from(s.entries)
    .innerJoin(s.pages, eq(s.pages.id, s.entries.pageId))
    .where(where)
    .orderBy(
      input.config.sortDirection === "asc" ? asc(order) : desc(order),
      asc(s.pages.id)
    )
    .limit(input.limit + 1)
    .offset(input.offset);
  const hasMore = list.length > input.limit;
  const selected = list.slice(0, input.limit);
  const propertyValues = selected.length
    ? await db
        .select()
        .from(s.values)
        .where(
          inArray(
            s.values.pageId,
            selected.map((r) => r.id)
          )
        )
    : [];
  return {
    rows: selected.map((row) => ({
      ...row,
      values: Object.fromEntries(
        propertyValues
          .filter((v) => v.pageId === row.id)
          .map((v) => [
            v.propertyId,
            { value: valueFrom(v), revision: v.revision },
          ])
      ),
    })),
    hasMore,
    nextOffset: input.offset + selected.length,
  };
}
