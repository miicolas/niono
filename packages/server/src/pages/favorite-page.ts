import { db, schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { accessPage } from "../access";

export async function favoritePage(
  userId: string,
  id: string,
  enabled: boolean,
) {
  await accessPage(db, userId, id);
  if (enabled)
    await db
      .insert(s.favorites)
      .values({ pageId: id, userId, position: Date.now() })
      .onConflictDoNothing();
  else
    await db
      .delete(s.favorites)
      .where(and(eq(s.favorites.pageId, id), eq(s.favorites.userId, userId)));
  return { ok: true };
}
