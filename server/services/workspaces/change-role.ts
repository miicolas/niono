import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { lockWorkspace } from "@/server/services/access/lock-workspace";
import { workspaceRole } from "@/server/services/access/workspace-role";

export function changeRole(
  userId: string,
  input: {
    workspaceId: string;
    memberId: string;
    role: "editor" | "viewer" | "remove";
  }
) {
  return db.transaction(async (tx) => {
    await lockWorkspace(tx, input.workspaceId);
    if ((await workspaceRole(tx, userId, input.workspaceId)) !== "owner") {
      throw new ORPCError("FORBIDDEN");
    }
    const old = await workspaceRole(tx, input.memberId, input.workspaceId);
    if (old === "owner") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Le propriétaire de l’espace doit être conservé.",
      });
    }
    if (input.role === "remove") {
      await tx
        .delete(s.members)
        .where(
          and(
            eq(s.members.workspaceId, input.workspaceId),
            eq(s.members.userId, input.memberId)
          )
        );
    } else {
      await tx
        .update(s.members)
        .set({ role: input.role })
        .where(
          and(
            eq(s.members.workspaceId, input.workspaceId),
            eq(s.members.userId, input.memberId)
          )
        );
    }
    return { ok: true };
  });
}
