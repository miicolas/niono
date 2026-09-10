import { db, schema as s } from "@digipm/db";
import { and, eq, sql, inArray } from "drizzle-orm";
import { workspaceRole } from "../access";

export async function listPages(
  userId: string,
  workspaceId: string,
  trash = false,
) {
  await workspaceRole(db, userId, workspaceId);
  const result = await db.execute<{
    id: string;
  }>(sql`WITH RECURSIVE visible AS (
    SELECT p.id,p.parent_id, p.deleted_at IS NOT NULL AS trashed,0 AS depth FROM pages p WHERE p.workspace_id=${workspaceId} AND p.parent_id IS NULL AND (NOT p.private_root OR p.created_by=${userId} OR EXISTS(SELECT 1 FROM page_grants g WHERE g.page_id=p.id AND g.user_id=${userId}))
    UNION ALL SELECT p.id,p.parent_id,v.trashed OR p.deleted_at IS NOT NULL,v.depth+1 FROM pages p JOIN visible v ON p.parent_id=v.id WHERE v.depth<30 AND p.workspace_id=${workspaceId} AND (NOT p.private_root OR p.created_by=${userId} OR EXISTS(SELECT 1 FROM page_grants g WHERE g.page_id=p.id AND g.user_id=${userId}))
  ) SELECT id FROM visible WHERE trashed=${trash} LIMIT 10000`);
  if (!result.rows.length) return [];
  return db
    .select({
      id: s.pages.id,
      workspaceId: s.pages.workspaceId,
      parentId: s.pages.parentId,
      title: s.pages.title,
      icon: s.pages.icon,
      cover: s.pages.cover,
      kind: s.pages.kind,
      position: s.pages.position,
      privateRoot: s.pages.privateRoot,
      createdBy: s.pages.createdBy,
      deletedAt: s.pages.deletedAt,
      updatedAt: s.pages.updatedAt,
      revision: s.pages.revision,
      favorite: s.favorites.pageId,
      favoritePosition: s.favorites.position,
    })
    .from(s.pages)
    .leftJoin(
      s.favorites,
      and(eq(s.favorites.pageId, s.pages.id), eq(s.favorites.userId, userId)),
    )
    .where(
      inArray(
        s.pages.id,
        result.rows.map((r) => r.id),
      ),
    )
    .orderBy(s.pages.position, s.pages.id);
}
