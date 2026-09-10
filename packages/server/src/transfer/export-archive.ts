import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db, schema as s } from "@digipm/db";
import { eq, sql } from "drizzle-orm";
import { archiveSchema, type Archive } from "@digipm/contracts";
import { accessPage, lockWorkspace } from "../access";
import { tooLarge } from "./too-large";
import { assetDirectory as root } from "../assets/asset-directory";

export async function exportArchive(
  userId: string,
  pageId: string,
  includeAssets: boolean,
): Promise<Archive> {
  return db.transaction(async (tx) => {
    const { page } = await accessPage(tx, userId, pageId);
    await lockWorkspace(tx, page.workspaceId);
    await accessPage(tx, userId, pageId);
    const tree = await tx.execute<{ id: string; depth: number }>(
      sql`WITH RECURSIVE tree AS (SELECT id,0 depth FROM pages WHERE id=${pageId} UNION ALL SELECT p.id,t.depth+1 FROM pages p JOIN tree t ON p.parent_id=t.id WHERE p.deleted_at IS NULL AND t.depth<30) SELECT * FROM tree ORDER BY depth,id LIMIT 201`,
    );
    if (tree.rows.length > 200) throw tooLarge();
    const archive: Archive = {
      format: "digipm-archive",
      version: 1,
      pages: [],
      sources: [],
      properties: [],
      entries: [],
      values: [],
      views: [],
      assets: [],
      warnings: [],
    };
    let total = 0;
    for (const row of tree.rows) {
      let access;
      try {
        access = await accessPage(tx, userId, row.id);
      } catch {
        archive.warnings.push("Une page inaccessible a été omise.");
        continue;
      }
      const p = access.page;
      const [doc] = await tx
        .select()
        .from(s.documents)
        .where(eq(s.documents.pageId, p.id));
      const exported = {
        id: p.id,
        parentId: p.id === pageId ? null : p.parentId,
        title: p.title,
        icon: p.icon,
        cover: p.cover,
        kind: p.kind,
        privateRoot: p.privateRoot,
        content: doc!.content,
      };
      archive.pages.push(exported);
      total += Buffer.byteLength(JSON.stringify(exported));
      if (total > 16 * 1024 * 1024) throw tooLarge();
      const [source] = await tx
        .select()
        .from(s.sources)
        .where(eq(s.sources.pageId, p.id));
      if (source) {
        archive.sources.push({ id: source.id, pageId: p.id });
        archive.properties.push(
          ...(await tx
            .select()
            .from(s.properties)
            .where(eq(s.properties.sourceId, source.id))),
        );
        archive.views.push(
          ...(await tx
            .select()
            .from(s.views)
            .where(eq(s.views.sourceId, source.id))),
        );
      }
      const [entry] = await tx
        .select()
        .from(s.entries)
        .where(eq(s.entries.pageId, p.id));
      if (entry) {
        archive.entries.push(entry);
        for (const v of await tx
          .select()
          .from(s.values)
          .where(eq(s.values.pageId, p.id)))
          archive.values.push({
            pageId: p.id,
            propertyId: v.propertyId,
            value:
              v.textValue ??
              v.numberValue ??
              v.boolValue ??
              v.arrayValue ??
              null,
          });
      }
      const assets = await tx
        .select()
        .from(s.assets)
        .where(eq(s.assets.pageId, p.id));
      if (includeAssets)
        for (const asset of assets) {
          total += Math.ceil((asset.size * 4) / 3);
          if (total > 16 * 1024 * 1024) throw tooLarge();
          archive.assets.push({
            id: asset.id,
            pageId: p.id,
            name: asset.name,
            data: (await readFile(join(root(), asset.key))).toString("base64"),
          });
        }
      else if (assets.length)
        archive.warnings.push(
          `Les fichiers de « ${p.title} » ne sont pas inclus.`,
        );
    }
    const sourceIds = new Set(archive.sources.map((s) => s.id));
    archive.entries = archive.entries.filter((e) => sourceIds.has(e.sourceId));
    const entryIds = new Set(archive.entries.map((e) => e.pageId));
    archive.values = archive.values.filter((v) => entryIds.has(v.pageId));
    if (!includeAssets) {
      const fileProperties = new Set(
        archive.properties.filter((p) => p.type === "files").map((p) => p.id),
      );
      archive.values = archive.values.map((cell) =>
        fileProperties.has(cell.propertyId) ? { ...cell, value: [] } : cell,
      );
    }
    return archiveSchema.parse(archive);
  });
}
