import { sql } from "drizzle-orm";
import { db } from "@/db";
import { visiblePagesCte } from "@/server/services/access/visible-pages";
import { workspaceRole } from "@/server/services/access/workspace-role";

export async function searchPages(
  userId: string,
  workspaceId: string,
  query: string
) {
  await workspaceRole(db, userId, workspaceId);
  const matched = await db.execute<{
    id: string;
    title: string;
    icon: string;
    excerpt: string;
  }>(sql`
    WITH RECURSIVE ${visiblePagesCte(userId, workspaceId)}
    SELECT p.id,p.title,p.icon,left(d.plain_text,180) excerpt FROM pages p JOIN page_documents d ON d.page_id=p.id JOIN visible v ON v.id=p.id AND NOT v.trashed
    WHERE p.title ILIKE ${`%${query.replace(/[%_\\]/g, "\\$&")}%`} OR to_tsvector('simple',d.plain_text) @@ plainto_tsquery('simple',${query})
    ORDER BY ts_rank(to_tsvector('simple',d.plain_text),plainto_tsquery('simple',${query})) DESC,p.updated_at DESC,p.id LIMIT 40
  `);
  return matched.rows;
}
