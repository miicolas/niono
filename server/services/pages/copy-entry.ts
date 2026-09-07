import { eq } from "drizzle-orm";
import { type DatabaseTransaction, schema as s } from "@/db";
import { required } from "@/server/lib/required";
import type { CopyMappings } from "./copy-mappings";

/** Copie l'appartenance d'une entrée à sa source et ses valeurs de propriétés. */
export async function copyEntry(
  tx: DatabaseTransaction,
  originalPageId: string,
  mappings: CopyMappings
) {
  const [entry] = await tx
    .select()
    .from(s.entries)
    .where(eq(s.entries.pageId, originalPageId));
  if (!entry) {
    return;
  }
  const newId = required(mappings.pages.get(originalPageId));
  await tx.insert(s.entries).values({
    ...entry,
    pageId: newId,
    sourceId: mappings.sources.get(entry.sourceId) ?? entry.sourceId,
    position: Date.now(),
  });
  const values = await tx
    .select()
    .from(s.values)
    .where(eq(s.values.pageId, originalPageId));
  if (values.length) {
    await tx.insert(s.values).values(
      values.map((value) => ({
        ...value,
        pageId: newId,
        propertyId:
          mappings.properties.get(value.propertyId) ?? value.propertyId,
        arrayValue: value.arrayValue?.map(
          (id) => mappings.assets.get(id) ?? id
        ),
        revision: 0,
      }))
    );
  }
}
