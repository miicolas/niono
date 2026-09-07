import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { schema as s } from "@/db";
import { accessPage } from "@/server/services/access/access-page";
import { withPage } from "@/server/services/access/with-page";

export function trashPage(userId: string, id: string, restore = false) {
  return withPage(
    userId,
    id,
    async (tx, { page }) => {
      const parentId = page.parentId;
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
    restore
  );
}
