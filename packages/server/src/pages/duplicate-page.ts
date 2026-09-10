import { remapDocumentMentions } from "@digipm/contracts/definitions/remap-document-mentions";
import { schema as s } from "@digipm/db";
import { eq, sql } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { randomUUID } from "node:crypto";
import {
  documentText,
  viewSchema,
  remapChartProperties,
  type DocumentNode,
} from "@digipm/contracts";
import { accessPage, withPage } from "../access";

export async function duplicatePage(userId: string, id: string) {
  return withPage(userId, id, async (tx, { page }) => {
    const tree = await tx.execute<{ id: string }>(
      sql`WITH RECURSIVE a AS (SELECT id FROM pages WHERE id=${id} UNION ALL SELECT p.id FROM pages p JOIN a ON p.parent_id=a.id WHERE p.deleted_at IS NULL) SELECT id FROM a LIMIT 201`,
    );
    if (tree.rows.length > 200)
      throw new ORPCError("BAD_REQUEST", {
        message: "Dupliquez au maximum 200 pages à la fois.",
      });
    const mapping = new Map(tree.rows.map((p) => [p.id, randomUUID()]));
    const propertyMapping = new Map<string, string>();
    const sourceMapping = new Map<string, string>();
    const assetMapping = new Map<string, string>();
    for (const row of tree.rows) {
      const assets = await tx
        .select()
        .from(s.assets)
        .where(eq(s.assets.pageId, row.id));
      for (const asset of assets) assetMapping.set(asset.id, randomUUID());
    }
    for (const row of tree.rows) {
      const { page: original } = await accessPage(tx, userId, row.id);
      const [doc] = await tx
        .select()
        .from(s.documents)
        .where(eq(s.documents.pageId, row.id));
      const copied = remapDocumentMentions(
        JSON.parse(JSON.stringify(doc!.content), (key, value) => {
          if (key === "id" && typeof value === "string") return randomUUID();
          if (key === "pageId" && mapping.has(value)) return mapping.get(value);
          if (typeof value === "string" && value.startsWith("/api/assets/")) {
            const assetId = value.slice("/api/assets/".length);
            if (assetMapping.has(assetId))
              return "/api/assets/" + assetMapping.get(assetId);
          }
          return value;
        }) as DocumentNode,
        mapping,
      );
      const newId = mapping.get(row.id)!;
      const coverId = original.cover?.replace("/api/assets/", "");
      await tx.insert(s.pages).values({
        ...original,
        id: newId,
        title: row.id === id ? `${original.title} (copie)` : original.title,
        parentId:
          row.id === id ? page.parentId : mapping.get(original.parentId!)!,
        createdBy: userId,
        privateRoot: original.privateRoot,
        cover:
          coverId && assetMapping.has(coverId)
            ? "/api/assets/" + assetMapping.get(coverId)
            : original.cover,
        revision: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: Date.now(),
      });
      await tx.insert(s.documents).values({
        pageId: newId,
        content: copied,
        plainText: documentText(copied),
      });
      const assets = await tx
        .select()
        .from(s.assets)
        .where(eq(s.assets.pageId, row.id));
      for (const asset of assets)
        await tx
          .insert(s.assets)
          .values({ ...asset, id: assetMapping.get(asset.id)!, pageId: newId });
      const [source] = await tx
        .select()
        .from(s.sources)
        .where(eq(s.sources.pageId, row.id));
      if (source) {
        const sourceId = randomUUID();
        sourceMapping.set(source.id, sourceId);
        await tx
          .insert(s.sources)
          .values({ ...source, id: sourceId, pageId: newId });
        for (const property of await tx
          .select()
          .from(s.properties)
          .where(eq(s.properties.sourceId, source.id))) {
          const propertyId = randomUUID();
          propertyMapping.set(property.id, propertyId);
          await tx
            .insert(s.properties)
            .values({ ...property, id: propertyId, sourceId });
        }
        for (const view of await tx
          .select()
          .from(s.views)
          .where(eq(s.views.sourceId, source.id))) {
          const c = viewSchema.parse(view.config);
          await tx.insert(s.views).values({
            ...view,
            id: randomUUID(),
            sourceId,
            revision: 0,
            config: {
              ...c,
              chart: remapChartProperties(c.chart, propertyMapping),
              sortBy: propertyMapping.get(c.sortBy) ?? c.sortBy,
              sorts: c.sorts.map((sort) => ({
                ...sort,
                propertyId:
                  propertyMapping.get(sort.propertyId) ?? sort.propertyId,
              })),
              columnOrder: c.columnOrder.map(
                (id) => propertyMapping.get(id) ?? id,
              ),
              columnWidths: Object.fromEntries(
                Object.entries(c.columnWidths).map(([id, width]) => [
                  propertyMapping.get(id) ?? id,
                  width,
                ]),
              ),
              groupBy: c.groupBy ? propertyMapping.get(c.groupBy) : undefined,
              hidden: c.hidden.map((id) => propertyMapping.get(id) ?? id),
              filters: c.filters.map((f) => ({
                ...f,
                propertyId: propertyMapping.get(f.propertyId) ?? f.propertyId,
              })),
            },
          });
        }
      }
    }
    for (const row of tree.rows) {
      const [entry] = await tx
        .select()
        .from(s.entries)
        .where(eq(s.entries.pageId, row.id));
      if (!entry) continue;
      const newId = mapping.get(row.id)!;
      await tx.insert(s.entries).values({
        ...entry,
        pageId: newId,
        sourceId: sourceMapping.get(entry.sourceId) ?? entry.sourceId,
        position: Date.now(),
      });
      for (const value of await tx
        .select()
        .from(s.values)
        .where(eq(s.values.pageId, row.id)))
        await tx.insert(s.values).values({
          ...value,
          pageId: newId,
          propertyId: propertyMapping.get(value.propertyId) ?? value.propertyId,
          arrayValue: value.arrayValue?.map((id) => assetMapping.get(id) ?? id),
          revision: 0,
        });
    }
    return { id: mapping.get(id)! };
  });
}
