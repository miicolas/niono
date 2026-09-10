import { db, schema as s } from "@digipm/db";
import { eq, desc } from "drizzle-orm";
import { accessPage } from "../access";

export async function listVersions(userId: string, id: string) {
  await accessPage(db, userId, id);
  return db
    .select({
      id: s.versions.id,
      revision: s.versions.revision,
      createdAt: s.versions.createdAt,
      content: s.versions.content,
      author: s.user.name,
    })
    .from(s.versions)
    .innerJoin(s.user, eq(s.user.id, s.versions.authorId))
    .where(eq(s.versions.pageId, id))
    .orderBy(desc(s.versions.createdAt))
    .limit(100);
}
