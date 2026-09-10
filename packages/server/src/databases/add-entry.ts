import { schema as s } from "@digipm/db";
import { eq } from "drizzle-orm";
import { emptyDocument } from "@digipm/contracts";
import { withPage, missing } from "../access";

export async function addEntry(
  userId: string,
  input: { pageId: string; title: string },
) {
  return withPage(userId, input.pageId, async (tx) => {
    const [source] = await tx
      .select()
      .from(s.sources)
      .where(eq(s.sources.pageId, input.pageId));
    if (!source) throw missing();
    const [page] = await tx
      .insert(s.pages)
      .values({
        workspaceId: source.workspaceId,
        parentId: input.pageId,
        title: input.title,
        createdBy: userId,
        position: Date.now(),
      })
      .returning();
    await tx
      .insert(s.documents)
      .values({ pageId: page!.id, content: emptyDocument });
    await tx
      .insert(s.entries)
      .values({ sourceId: source.id, pageId: page!.id, position: Date.now() });
    return page!;
  });
}
