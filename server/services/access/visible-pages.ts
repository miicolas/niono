import { sql } from "drizzle-orm";

/** SQL predicate: the page aliased `alias` is visible to `userId` (public, own, or granted). */
export const visibleTo = (userId: string, alias = "p") => {
  const a = sql.raw(alias);
  return sql`(NOT ${a}.private_root OR ${a}.created_by=${userId} OR EXISTS(SELECT 1 FROM page_grants g WHERE g.page_id=${a}.id AND g.user_id=${userId}))`;
};

/** Recursive CTE body `visible(id,parent_id,trashed,depth)` of every page of the workspace reachable by `userId`. */
export const visiblePagesCte = (userId: string, workspaceId: string) =>
  sql`visible AS (
    SELECT p.id,p.parent_id,p.deleted_at IS NOT NULL AS trashed,0 AS depth FROM pages p WHERE p.workspace_id=${workspaceId} AND p.parent_id IS NULL AND ${visibleTo(userId)}
    UNION ALL SELECT p.id,p.parent_id,v.trashed OR p.deleted_at IS NOT NULL,v.depth+1 FROM pages p JOIN visible v ON p.parent_id=v.id WHERE v.depth<30 AND p.workspace_id=${workspaceId} AND ${visibleTo(userId)}
  )`;
