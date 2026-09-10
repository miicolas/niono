import { db, schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { accessPage, workspaceRole, lockWorkspace, missing } from "../access";

export async function reorderFavorites(
  userId: string,
  workspaceId: string,
  ids: string[],
) {
  return db.transaction(async (tx) => {
    await lockWorkspace(tx, workspaceId);
    await workspaceRole(tx, userId, workspaceId);
    if (new Set(ids).size !== ids.length) throw new ORPCError("BAD_REQUEST");
    for (const [index, id] of ids.entries()) {
      const { page } = await accessPage(tx, userId, id);
      if (page.workspaceId !== workspaceId) throw missing();
      await tx
        .update(s.favorites)
        .set({ position: index * 1024 })
        .where(and(eq(s.favorites.userId, userId), eq(s.favorites.pageId, id)));
    }
    return { ok: true };
  });
}
