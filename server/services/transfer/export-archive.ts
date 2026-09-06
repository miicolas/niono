import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import {
  type Archive,
  archiveSchema,
  emptyArchive,
  MAX_ARCHIVE_BYTES,
} from "@/validators/contracts";
import { accessPage, lockWorkspace, missing, visibleTo } from "../access";
import { assetRoot } from "../assets";
import { valueFrom } from "../databases/property-values";
import { tooLarge } from "./too-large";

function groupBy<T>(rows: T[], key: (row: T) => string) {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const group = map.get(key(row)) ?? [];
    group.push(row);
    map.set(key(row), group);
  }
  return map;
}
export async function exportArchive(
  userId: string,
  pageId: string,
  includeAssets: boolean
): Promise<Archive> {
  return db.transaction(async (tx) => {
    const [root] = await tx
      .select({ workspaceId: s.pages.workspaceId })
      .from(s.pages)
      .where(eq(s.pages.id, pageId));
    if (!root) {
      throw missing();
    }
    await lockWorkspace(tx, root.workspaceId);
    await accessPage(tx, userId, pageId);
    const tree = await tx.execute<{ id: string; visible: boolean }>(
      sql`WITH RECURSIVE tree AS (SELECT id,0 AS depth,true AS visible FROM pages WHERE id=${pageId} UNION ALL SELECT p.id,t.depth+1,t.visible AND ${visibleTo(userId)} FROM pages p JOIN tree t ON p.parent_id=t.id WHERE p.deleted_at IS NULL AND t.depth<30) SELECT id,visible FROM tree ORDER BY depth,id LIMIT 201`
    );
    if (tree.rows.length > 200) {
      throw tooLarge();
    }
    const archive = emptyArchive();
    if (tree.rows.some((row) => !row.visible)) {
      archive.warnings.push("Une page inaccessible a été omise.");
    }
    const ids = tree.rows.filter((row) => row.visible).map((row) => row.id);
    const pages = await tx
      .select()
      .from(s.pages)
      .where(inArray(s.pages.id, ids));
    const docs = await tx
      .select()
      .from(s.documents)
      .where(inArray(s.documents.pageId, ids));
    const sources = await tx
      .select()
      .from(s.sources)
      .where(inArray(s.sources.pageId, ids));
    const sourceIds = sources.map((source) => source.id);
    const properties = sourceIds.length
      ? await tx
          .select()
          .from(s.properties)
          .where(inArray(s.properties.sourceId, sourceIds))
      : [];
    const views = sourceIds.length
      ? await tx
          .select()
          .from(s.views)
          .where(inArray(s.views.sourceId, sourceIds))
      : [];
    const entries = sourceIds.length
      ? await tx
          .select()
          .from(s.entries)
          .where(
            and(
              inArray(s.entries.pageId, ids),
              inArray(s.entries.sourceId, sourceIds)
            )
          )
      : [];
    const entryIds = entries.map((entry) => entry.pageId);
    const values = entryIds.length
      ? await tx
          .select()
          .from(s.values)
          .where(inArray(s.values.pageId, entryIds))
      : [];
    const assets = await tx
      .select()
      .from(s.assets)
      .where(inArray(s.assets.pageId, ids));
    const pageById = new Map(pages.map((page) => [page.id, page]));
    const docByPage = new Map(docs.map((doc) => [doc.pageId, doc]));
    const assetsByPage = groupBy(assets, (asset) => asset.pageId);
    let total = 0;
    const budget = (bytes: number) => {
      total += bytes;
      if (total > MAX_ARCHIVE_BYTES) {
        throw tooLarge();
      }
    };
    for (const id of ids) {
      const p = pageById.get(id)!;
      const exported = {
        id: p.id,
        parentId: p.id === pageId ? null : p.parentId,
        title: p.title,
        icon: p.icon,
        cover: p.cover,
        kind: p.kind,
        privateRoot: p.privateRoot,
        content: docByPage.get(id)!.content,
      };
      archive.pages.push(exported);
      budget(Buffer.byteLength(JSON.stringify(exported)));
      const pageAssets = assetsByPage.get(id) ?? [];
      if (!includeAssets) {
        if (pageAssets.length) {
          archive.warnings.push(
            `Les fichiers de « ${p.title} » ne sont pas inclus.`
          );
        }
        continue;
      }
      for (const asset of pageAssets) {
        budget(Math.ceil((asset.size * 4) / 3));
        archive.assets.push({
          id: asset.id,
          pageId: p.id,
          name: asset.name,
          data: (await readFile(join(assetRoot(), asset.key))).toString(
            "base64"
          ),
        });
      }
    }
    archive.sources = sources.map((source) => ({
      id: source.id,
      pageId: source.pageId,
    }));
    archive.properties = properties;
    archive.views = views;
    archive.entries = entries;
    const fileProperties = new Set(
      properties.filter((p) => p.type === "files").map((p) => p.id)
    );
    archive.values = values.map((v) => ({
      pageId: v.pageId,
      propertyId: v.propertyId,
      value:
        !includeAssets && fileProperties.has(v.propertyId) ? [] : valueFrom(v),
    }));
    return archiveSchema.parse(archive);
  });
}
