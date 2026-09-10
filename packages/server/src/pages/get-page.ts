import { db, schema as s } from "@digipm/db";
import { eq } from "drizzle-orm";
import { accessPage } from "../access";

export async function getPage(userId: string, pageId: string) {
  const access = await accessPage(db, userId, pageId);
  const [document] = await db
    .select()
    .from(s.documents)
    .where(eq(s.documents.pageId, pageId));
  await db
    .insert(s.recentPages)
    .values({ userId, pageId })
    .onConflictDoUpdate({
      target: [s.recentPages.userId, s.recentPages.pageId],
      set: { visitedAt: new Date() },
    });
  const grants =
    access.page.createdBy === userId
      ? await db
          .select({ userId: s.grants.userId, role: s.grants.role })
          .from(s.grants)
          .where(eq(s.grants.pageId, pageId))
      : [];
  const { collaborationState: _state, ...publicDocument } = document!;
  return {
    ...access,
    grants,
    document: publicDocument,
    aiAvailable: !!(process.env.AI_BASE_URL && process.env.AI_MODEL),
  };
}
