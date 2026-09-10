import { db, schema as s } from "@digipm/db";
import { eq, sql, inArray, asc, desc } from "drizzle-orm";
import { viewSorts } from "@digipm/contracts";
import { indexPropertyValues } from "./index-property-values";
import { entryQuery, type EntryQuery } from "./entry-query";

export async function queryEntries(
  userId: string,
  input: EntryQuery & { offset: number; limit: number },
) {
  const { config, expr, where } = await entryQuery(userId, input);
  const sorts = viewSorts(config);
  const order = sorts.length
    ? sorts.map((sort) => {
        const e = expr(sort.propertyId);
        return sort.direction === "asc"
          ? sql`${e} ASC NULLS LAST`
          : sql`${e} DESC NULLS LAST`;
      })
    : [
        config.sortDirection === "desc"
          ? desc(s.entries.position)
          : asc(s.entries.position),
      ];
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
    .orderBy(...order, asc(s.pages.id))
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
            selected.map((r) => r.id),
          ),
        )
    : [];
  const valuesByPage = indexPropertyValues(propertyValues);
  return {
    rows: selected.map((row) => ({
      ...row,
      values: valuesByPage.get(row.id) ?? {},
    })),
    hasMore,
    nextOffset: input.offset + selected.length,
  };
}
