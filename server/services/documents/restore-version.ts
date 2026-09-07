import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { schema as s } from "@/db";
import { documentText } from "@/lib/editor/document-text";
import { required } from "@/server/lib/required";
import { missing } from "@/server/services/access/errors";
import { withPage } from "@/server/services/access/with-page";

export function restoreVersion(
  userId: string,
  id: string,
  versionId: string,
  expectedRevision: number
) {
  return withPage(userId, id, async (tx) => {
    const [v] = await tx
      .select()
      .from(s.versions)
      .where(and(eq(s.versions.id, versionId), eq(s.versions.pageId, id)));
    if (!v) {
      throw missing();
    }
    const [current] = await tx
      .select()
      .from(s.documents)
      .where(eq(s.documents.pageId, id));
    if (required(current).revision !== expectedRevision) {
      throw new ORPCError("CONFLICT");
    }
    await tx.insert(s.versions).values({
      pageId: id,
      content: required(current).content,
      revision: required(current).revision,
      authorId: userId,
    });
    await tx
      .update(s.documents)
      .set({
        content: v.content,
        plainText: documentText(v.content),
        revision: required(current).revision + 1,
        updatedAt: new Date(),
      })
      .where(eq(s.documents.pageId, id));
    await tx
      .update(s.pages)
      .set({ updatedAt: new Date() })
      .where(eq(s.pages.id, id));
    return { revision: required(current).revision + 1 };
  });
}
