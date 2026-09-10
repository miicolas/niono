import { db, schema as s } from "@digipm/db";
import { eq } from "drizzle-orm";
import { accessPage, missing } from "../access";

export async function sourceFor(userId: string, pageId: string) {
  await accessPage(db, userId, pageId);
  const [source] = await db
    .select()
    .from(s.sources)
    .where(eq(s.sources.pageId, pageId));
  if (!source) throw missing();
  return source;
}
