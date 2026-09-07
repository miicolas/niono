import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { required } from "@/server/lib/required";
import { accessPage } from "@/server/services/access/access-page";
import { resolveModel } from "@/server/services/ai/resolve-model";

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
  return {
    ...access,
    grants,
    document: required(document),
    aiAvailable: resolveModel() !== undefined,
  };
}
