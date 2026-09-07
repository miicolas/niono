import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { visiblePagesCte } from "@/server/services/access/visible-pages";
import { workspaceRole } from "@/server/services/access/workspace-role";

export async function listPages(
  userId: string,
  workspaceId: string,
  trash = false
) {
  await workspaceRole(db, userId, workspaceId);
  const result = await db.execute<{ id: string }>(
    sql`WITH RECURSIVE ${visiblePagesCte(userId, workspaceId)} SELECT id FROM visible WHERE trashed=${trash} LIMIT 10000`
  );
  if (!result.rows.length) {
    return [];
  }
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
      and(eq(s.favorites.pageId, s.pages.id), eq(s.favorites.userId, userId))
    )
    .where(
      inArray(
        s.pages.id,
        result.rows.map((r) => r.id)
      )
    )
    .orderBy(s.pages.position, s.pages.id);
}
