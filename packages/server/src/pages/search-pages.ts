import { db } from "@digipm/db";
import { sql } from "drizzle-orm";
import { workspaceRole } from "../access";

export async function searchPages(
  userId: string,
  workspaceId: string,
  query: string,
) {
  await workspaceRole(db, userId, workspaceId);
  const matched = await db.execute<{
    id: string;
    title: string;
    icon: string;
    excerpt: string;
  }>(sql`
    WITH RECURSIVE visible AS (
      SELECT p.id,0 depth FROM pages p WHERE p.workspace_id=${workspaceId} AND p.parent_id IS NULL AND p.deleted_at IS NULL AND (NOT p.private_root OR p.created_by=${userId} OR EXISTS(SELECT 1 FROM page_grants g WHERE g.page_id=p.id AND g.user_id=${userId}))
      UNION ALL SELECT p.id,v.depth+1 FROM pages p JOIN visible v ON p.parent_id=v.id WHERE v.depth<30 AND p.workspace_id=${workspaceId} AND p.deleted_at IS NULL AND (NOT p.private_root OR p.created_by=${userId} OR EXISTS(SELECT 1 FROM page_grants g WHERE g.page_id=p.id AND g.user_id=${userId}))
    ) SELECT p.id,p.title,p.icon,left(d.plain_text,180) excerpt FROM pages p JOIN page_documents d ON d.page_id=p.id JOIN visible v ON v.id=p.id
    WHERE p.title ILIKE ${"%" + query.replace(/[%_\\]/g, "\\$&") + "%"} OR to_tsvector('simple',d.plain_text) @@ plainto_tsquery('simple',${query})
    ORDER BY ts_rank(to_tsvector('simple',d.plain_text),plainto_tsquery('simple',${query})) DESC,p.updated_at DESC,p.id LIMIT 40
  `);
  return matched.rows;
}
