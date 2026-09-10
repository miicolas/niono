import { schema as s } from "@digipm/db";
import { eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { accessPage, withPage } from "../access";

export async function trashPage(userId: string, id: string, restore = false) {
  return withPage(
    userId,
    id,
    async (tx, { page }) => {
      let parentId = page.parentId;
      if (restore && parentId) {
        try {
          await accessPage(tx, userId, parentId, true);
        } catch {
          throw new ORPCError("PRECONDITION_FAILED", {
            message:
              "Restaurez d’abord la page parente afin de préserver les accès de cette sous-page.",
          });
        }
      }
      await tx
        .update(s.pages)
        .set({
          deletedAt: restore ? null : new Date(),
          parentId,
          updatedAt: new Date(),
        })
        .where(eq(s.pages.id, id));
      return { ok: true };
    },
    restore,
  );
}
