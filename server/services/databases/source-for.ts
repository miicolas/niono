import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { accessPage } from "@/server/services/access/access-page";
import { missing } from "@/server/services/access/errors";

/** Source de données d'une page de base visible par l'utilisateur. */
export async function sourceFor(userId: string, pageId: string) {
  await accessPage(db, userId, pageId);
  const [source] = await db
    .select()
    .from(s.sources)
    .where(eq(s.sources.pageId, pageId));
  if (!source) {
    throw missing();
  }
  return source;
}
