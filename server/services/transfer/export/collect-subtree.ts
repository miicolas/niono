import { sql } from "drizzle-orm";
import type { DatabaseTransaction } from "@/db";
import { visibleTo } from "@/server/services/access/visible-pages";
import { tooLarge } from "../too-large";

const MAX_PAGES = 200;

/** Identifiants du sous-arbre exportable ; signale si une page invisible a été omise. */
export async function collectSubtree(
  tx: DatabaseTransaction,
  userId: string,
  pageId: string
) {
  const tree = await tx.execute<{ id: string; visible: boolean }>(
    sql`WITH RECURSIVE tree AS (SELECT id,0 AS depth,true AS visible FROM pages WHERE id=${pageId} UNION ALL SELECT p.id,t.depth+1,t.visible AND ${visibleTo(userId)} FROM pages p JOIN tree t ON p.parent_id=t.id WHERE p.deleted_at IS NULL AND t.depth<30) SELECT id,visible FROM tree ORDER BY depth,id LIMIT 201`
  );
  if (tree.rows.length > MAX_PAGES) {
    throw tooLarge();
  }
  return {
    ids: tree.rows.filter((row) => row.visible).map((row) => row.id),
    omitted: tree.rows.some((row) => !row.visible),
  };
}
