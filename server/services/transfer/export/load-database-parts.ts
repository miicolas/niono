import { and, inArray } from "drizzle-orm";
import { type DatabaseTransaction, schema as s } from "@/db";

/** Sources, propriétés, vues, entrées et valeurs des bases contenues dans les pages exportées. */
export async function loadDatabaseParts(
  tx: DatabaseTransaction,
  ids: string[]
) {
  const sources = await tx
    .select()
    .from(s.sources)
    .where(inArray(s.sources.pageId, ids));
  const sourceIds = sources.map((source) => source.id);
  if (!sourceIds.length) {
    return { sources, properties: [], views: [], entries: [], values: [] };
  }
  const properties = await tx
    .select()
    .from(s.properties)
    .where(inArray(s.properties.sourceId, sourceIds));
  const views = await tx
    .select()
    .from(s.views)
    .where(inArray(s.views.sourceId, sourceIds));
  const entries = await tx
    .select()
    .from(s.entries)
    .where(
      and(
        inArray(s.entries.pageId, ids),
        inArray(s.entries.sourceId, sourceIds)
      )
    );
  const entryIds = entries.map((entry) => entry.pageId);
  const values = entryIds.length
    ? await tx.select().from(s.values).where(inArray(s.values.pageId, entryIds))
    : [];
  return { sources, properties, views, entries, values };
}
