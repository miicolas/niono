import { schema as s } from "@/db";
import { emptyDocument } from "@/lib/editor/empty-document";
import { required } from "@/server/lib/required";
import { withPage } from "@/server/services/access/with-page";
import { lockedSource } from "./locked-source";

/** Ajoute une entrée (page fille) à la base et à sa source. */
export function addEntry(
  userId: string,
  input: { pageId: string; title: string }
) {
  return withPage(userId, input.pageId, async (tx) => {
    const source = await lockedSource(tx, input.pageId);
    const [inserted] = await tx
      .insert(s.pages)
      .values({
        workspaceId: source.workspaceId,
        parentId: input.pageId,
        title: input.title,
        createdBy: userId,
        position: Date.now(),
      })
      .returning();
    const page = required(inserted);
    await tx
      .insert(s.documents)
      .values({ pageId: page.id, content: emptyDocument });
    await tx
      .insert(s.entries)
      .values({ sourceId: source.id, pageId: page.id, position: Date.now() });
    return page;
  });
}
