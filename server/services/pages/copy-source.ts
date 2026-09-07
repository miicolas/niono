import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { type DatabaseTransaction, schema as s } from "@/db";
import { remapViewConfig } from "@/server/services/documents/remap";
import type { CopyMappings } from "./copy-mappings";

/** Copie la source de données d'une page de base (propriétés et vues) vers la page copiée. */
export async function copySource(
  tx: DatabaseTransaction,
  originalPageId: string,
  newPageId: string,
  mappings: CopyMappings
) {
  const [source] = await tx
    .select()
    .from(s.sources)
    .where(eq(s.sources.pageId, originalPageId));
  if (!source) {
    return;
  }
  const sourceId = randomUUID();
  mappings.sources.set(source.id, sourceId);
  await tx
    .insert(s.sources)
    .values({ ...source, id: sourceId, pageId: newPageId });
  const properties = await tx
    .select()
    .from(s.properties)
    .where(eq(s.properties.sourceId, source.id));
  if (properties.length) {
    await tx.insert(s.properties).values(
      properties.map((property) => {
        const propertyId = randomUUID();
        mappings.properties.set(property.id, propertyId);
        return { ...property, id: propertyId, sourceId };
      })
    );
  }
  const views = await tx
    .select()
    .from(s.views)
    .where(eq(s.views.sourceId, source.id));
  if (views.length) {
    await tx.insert(s.views).values(
      views.map((view) => ({
        ...view,
        id: randomUUID(),
        sourceId,
        revision: 0,
        config: remapViewConfig(view.config, mappings.properties),
      }))
    );
  }
}
