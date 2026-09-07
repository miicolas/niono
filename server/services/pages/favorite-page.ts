import { and, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { accessPage } from "@/server/services/access/access-page";

export async function favoritePage(
  userId: string,
  id: string,
  enabled: boolean
) {
  await accessPage(db, userId, id);
  if (enabled) {
    await db
      .insert(s.favorites)
      .values({ pageId: id, userId, position: Date.now() })
      .onConflictDoNothing();
  } else {
    await db
      .delete(s.favorites)
      .where(and(eq(s.favorites.pageId, id), eq(s.favorites.userId, userId)));
  }
  return { ok: true };
}
