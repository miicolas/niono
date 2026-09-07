import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { accessPage } from "@/server/services/access/access-page";
import { missing } from "@/server/services/access/errors";
import { lockWorkspace } from "@/server/services/access/lock-workspace";
import { workspaceRole } from "@/server/services/access/workspace-role";

export function reorderFavorites(
  userId: string,
  workspaceId: string,
  ids: string[]
) {
  return db.transaction(async (tx) => {
    await lockWorkspace(tx, workspaceId);
    await workspaceRole(tx, userId, workspaceId);
    if (new Set(ids).size !== ids.length) {
      throw new ORPCError("BAD_REQUEST");
    }
    for (const [index, id] of ids.entries()) {
      // biome-ignore lint/nursery/noAwaitInLoop: contrôle d'accès page par page dans la transaction
      const { page } = await accessPage(tx, userId, id);
      if (page.workspaceId !== workspaceId) {
        throw missing();
      }
      await tx
        .update(s.favorites)
        .set({ position: index * 1024 })
        .where(and(eq(s.favorites.userId, userId), eq(s.favorites.pageId, id)));
    }
    return { ok: true };
  });
}
