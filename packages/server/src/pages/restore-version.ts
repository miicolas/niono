import { replaceCollaboration } from "../realtime/replace-collaboration";
import { schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { documentText } from "@digipm/contracts";
import { withPage, missing } from "../access";

export async function restoreVersion(
  userId: string,
  id: string,
  versionId: string,
  expectedRevision: number,
) {
  return withPage(userId, id, async (tx, { page }) => {
    const [v] = await tx
      .select()
      .from(s.versions)
      .where(and(eq(s.versions.id, versionId), eq(s.versions.pageId, id)));
    if (!v) throw missing();
    const [current] = await tx
      .select()
      .from(s.documents)
      .where(eq(s.documents.pageId, id));
    if (current!.revision !== expectedRevision) throw new ORPCError("CONFLICT");
    await tx.insert(s.versions).values({
      pageId: id,
      content: current!.content,
      revision: current!.revision,
      authorId: userId,
    });
    await tx
      .update(s.documents)
      .set({
        ...replaceCollaboration(
          current!.collaborationState,
          current!.content,
          page.title,
          { content: v.content },
        ),
        plainText: documentText(v.content),
        revision: current!.revision + 1,
        updatedAt: new Date(),
      })
      .where(eq(s.documents.pageId, id));
    await tx
      .update(s.pages)
      .set({ updatedAt: new Date() })
      .where(eq(s.pages.id, id));
    return { revision: current!.revision + 1 };
  });
}
