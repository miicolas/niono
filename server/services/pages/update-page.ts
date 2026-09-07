import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { schema as s } from "@/db";
import { required } from "@/server/lib/required";
import { withPage } from "@/server/services/access/with-page";

export function updatePage(
  userId: string,
  input: {
    id: string;
    title?: string;
    icon?: string;
    cover?: string | null;
    coverPosition?: number;
    expectedRevision: number;
  }
) {
  return withPage(userId, input.id, async (tx, { page }) => {
    if (page.revision !== input.expectedRevision) {
      throw new ORPCError("CONFLICT", {
        message: "Cette page a été modifiée. Rechargez ses informations.",
      });
    }
    const { id, expectedRevision: _expectedRevision, ...changes } = input;
    const [updated] = await tx
      .update(s.pages)
      .set({ ...changes, revision: page.revision + 1, updatedAt: new Date() })
      .where(eq(s.pages.id, id))
      .returning();
    return required(updated);
  });
}
