import { db, schema as s } from "@digipm/db";
import { and, eq, desc } from "drizzle-orm";
import { accessPage, workspaceRole } from "../access";

export async function recentPages(userId: string, workspaceId: string) {
  await workspaceRole(db, userId, workspaceId);
  const candidates = await db
    .select({
      id: s.pages.id,
      title: s.pages.title,
      icon: s.pages.icon,
      visitedAt: s.recentPages.visitedAt,
    })
    .from(s.recentPages)
    .innerJoin(s.pages, eq(s.pages.id, s.recentPages.pageId))
    .where(
      and(
        eq(s.recentPages.userId, userId),
        eq(s.pages.workspaceId, workspaceId),
      ),
    )
    .orderBy(desc(s.recentPages.visitedAt))
    .limit(100);
  const visible: typeof candidates = [];
  for (const page of candidates) {
    try {
      await accessPage(db, userId, page.id);
      visible.push(page);
      if (visible.length === 12) break;
    } catch {
      /* Revoked or trashed pages are excluded. */
    }
  }
  return visible;
}
