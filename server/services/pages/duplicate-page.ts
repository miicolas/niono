import { randomUUID } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { inArray, sql } from "drizzle-orm";
import { schema as s } from "@/db";
import { required } from "@/server/lib/required";
import { withPage } from "@/server/services/access/with-page";
import { copyEntry } from "./copy-entry";
import type { CopyMappings } from "./copy-mappings";
import { copyPage } from "./copy-page";
import { copySource } from "./copy-source";

const MAX_PAGES = 200;

/** Duplique une page et son sous-arbre (documents, fichiers, bases, entrées) avec de nouveaux identifiants. */
export function duplicatePage(userId: string, id: string) {
  return withPage(userId, id, async (tx, { page }) => {
    const tree = await tx.execute<{ id: string }>(
      sql`WITH RECURSIVE a AS (SELECT id FROM pages WHERE id=${id} UNION ALL SELECT p.id FROM pages p JOIN a ON p.parent_id=a.id WHERE p.deleted_at IS NULL) SELECT id FROM a LIMIT 201`
    );
    if (tree.rows.length > MAX_PAGES) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Dupliquez au maximum 200 pages à la fois.",
      });
    }
    const ids = tree.rows.map((row) => row.id);
    const assets = await tx
      .select({ id: s.assets.id })
      .from(s.assets)
      .where(inArray(s.assets.pageId, ids));
    const mappings: CopyMappings = {
      pages: new Map(ids.map((pageId) => [pageId, randomUUID()])),
      assets: new Map(assets.map((asset) => [asset.id, randomUUID()])),
      sources: new Map(),
      properties: new Map(),
    };
    for (const originalId of ids) {
      // biome-ignore lint/nursery/noAwaitInLoop: les parents doivent exister avant leurs enfants
      const newId = await copyPage(tx, userId, page, originalId, mappings);
      await copySource(tx, originalId, newId, mappings);
    }
    for (const originalId of ids) {
      // biome-ignore lint/nursery/noAwaitInLoop: les sources copiées doivent précéder les entrées
      await copyEntry(tx, originalId, mappings);
    }
    return { id: required(mappings.pages.get(id)) };
  });
}
