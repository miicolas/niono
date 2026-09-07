import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { insertWorkspace } from "@/server/services/workspaces/insert-workspace";

/** Retourne un espace de l'utilisateur, en créant le premier au besoin. */
export function ensureWorkspace(userId: string) {
  return db.transaction(async (tx) => {
    await tx.select().from(s.user).where(eq(s.user.id, userId)).for("update");
    const [membership] = await tx
      .select()
      .from(s.members)
      .where(eq(s.members.userId, userId))
      .limit(1);
    if (membership) {
      return membership.workspaceId;
    }
    return (await insertWorkspace(tx, userId, "Mon espace")).id;
  });
}
