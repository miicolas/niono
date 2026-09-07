import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { schema as s } from "@/db";
import { withPage } from "@/server/services/access/with-page";
import { workspaceRole } from "@/server/services/access/workspace-role";

export function sharePage(
  userId: string,
  input: {
    pageId: string;
    privateRoot: boolean;
    grants: { userId: string; role: "editor" | "viewer" }[];
  }
) {
  return withPage(userId, input.pageId, async (tx, { page }) => {
    if (page.createdBy !== userId) {
      throw new ORPCError("FORBIDDEN", {
        message: "Seul le créateur peut modifier les accès de cette page.",
      });
    }
    for (const grant of input.grants) {
      // biome-ignore lint/nursery/noAwaitInLoop: vérification séquentielle des membres dans la transaction
      await workspaceRole(tx, grant.userId, page.workspaceId);
    }
    await tx
      .update(s.pages)
      .set({ privateRoot: input.privateRoot })
      .where(eq(s.pages.id, page.id));
    await tx.delete(s.grants).where(eq(s.grants.pageId, page.id));
    if (input.grants.length) {
      await tx
        .insert(s.grants)
        .values(input.grants.map((g) => ({ ...g, pageId: page.id })));
    }
    return { ok: true };
  });
}
