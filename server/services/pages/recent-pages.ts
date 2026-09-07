import { sql } from "drizzle-orm";
import { db } from "@/db";
import { visiblePagesCte } from "@/server/services/access/visible-pages";
import { workspaceRole } from "@/server/services/access/workspace-role";

export async function recentPages(userId: string, workspaceId: string) {
  await workspaceRole(db, userId, workspaceId);
  const result = await db.execute<{
    id: string;
    title: string;
    icon: string;
    visitedAt: Date;
  }>(sql`
    WITH RECURSIVE ${visiblePagesCte(userId, workspaceId)}
    SELECT p.id,p.title,p.icon,r.visited_at AS "visitedAt" FROM recent_pages r JOIN pages p ON p.id=r.page_id JOIN visible v ON v.id=p.id AND NOT v.trashed
    WHERE r.user_id=${userId} AND p.workspace_id=${workspaceId} ORDER BY r.visited_at DESC LIMIT 12
  `);
  return result.rows;
}
