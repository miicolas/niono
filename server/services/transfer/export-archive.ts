import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { accessPage } from "@/server/services/access/access-page";
import { missing } from "@/server/services/access/errors";
import { lockWorkspace } from "@/server/services/access/lock-workspace";
import { valueFrom } from "@/server/services/databases/property-values";
import {
  type Archive,
  archiveSchema,
  emptyArchive,
} from "@/validators/transfer";
import { collectSubtree } from "./export/collect-subtree";
import { exportPages } from "./export/export-pages";
import { loadDatabaseParts } from "./export/load-database-parts";

/** Exporte une page et son sous-arbre visible (200 pages et 16 Mo maximum). */
export function exportArchive(
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
    const { ids, omitted } = await collectSubtree(tx, userId, pageId);
    const archive = emptyArchive();
    if (omitted) {
      archive.warnings.push("Une page inaccessible a été omise.");
    }
    await exportPages(tx, archive, pageId, ids, includeAssets);
    const parts = await loadDatabaseParts(tx, ids);
    archive.sources = parts.sources.map((source) => ({
      id: source.id,
      pageId: source.pageId,
    }));
    archive.properties = parts.properties;
    archive.views = parts.views;
    archive.entries = parts.entries;
    const fileProperties = new Set(
      parts.properties.filter((p) => p.type === "files").map((p) => p.id)
    );
    archive.values = parts.values.map((v) => ({
      pageId: v.pageId,
      propertyId: v.propertyId,
      value:
        !includeAssets && fileProperties.has(v.propertyId) ? [] : valueFrom(v),
    }));
    return archiveSchema.parse(archive);
  });
}
