import { replaceCollaboration } from "../realtime/replace-collaboration";
import type { Connection } from "../access";
import { db, schema as s } from "@digipm/db";
import { eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { withPage } from "../access";

export async function updatePage(
  userId: string,
  input: {
    id: string;
    title?: string;
    icon?: string;
    cover?: string | null;
    coverPosition?: number;
    expectedRevision: number;
  },
  connection: Connection = db,
) {
  return withPage(
    userId,
    input.id,
    async (tx, { page }) => {
      if (page.revision !== input.expectedRevision)
        throw new ORPCError("CONFLICT", {
          message: "Cette page a été modifiée. Rechargez ses informations.",
        });
      const { id, expectedRevision, ...changes } = input;
      if (changes.title !== undefined) {
        const [document] = await tx
          .select()
          .from(s.documents)
          .where(eq(s.documents.pageId, id));
        if (document?.collaborationState)
          await tx
            .update(s.documents)
            .set({
              ...replaceCollaboration(
                document.collaborationState,
                document.content,
                page.title,
                { title: changes.title },
              ),
            })
            .where(eq(s.documents.pageId, id));
      }
      const [updated] = await tx
        .update(s.pages)
        .set({ ...changes, revision: page.revision + 1, updatedAt: new Date() })
        .where(eq(s.pages.id, id))
        .returning();
      return updated!;
    },
    false,
    connection,
  );
}
