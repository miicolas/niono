import { createHash } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { missing } from "@/server/services/access/errors";
import { lockWorkspace } from "@/server/services/access/lock-workspace";

export function acceptInvitation(userId: string, token: string) {
  return db.transaction(async (tx) => {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const [target] = await tx
      .select({ workspaceId: s.invitations.workspaceId })
      .from(s.invitations)
      .where(eq(s.invitations.tokenHash, tokenHash));
    if (!target) {
      throw missing();
    }
    await lockWorkspace(tx, target.workspaceId);
    const [invitation] = await tx
      .select()
      .from(s.invitations)
      .where(
        eq(
          s.invitations.tokenHash,
          createHash("sha256").update(token).digest("hex")
        )
      )
      .for("update");
    const [user] = await tx.select().from(s.user).where(eq(s.user.id, userId));
    if (
      !invitation ||
      invitation.acceptedAt ||
      invitation.expiresAt < new Date() ||
      invitation.email !== user?.email.toLowerCase()
    ) {
      throw missing();
    }
    if (!user.emailVerified) {
      throw new ORPCError("FORBIDDEN", {
        message:
          "Vérifiez votre adresse email avant d’accepter cette invitation.",
      });
    }
    await tx
      .insert(s.members)
      .values({
        workspaceId: invitation.workspaceId,
        userId,
        role: invitation.role,
      })
      .onConflictDoNothing();
    await tx
      .update(s.invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(s.invitations.id, invitation.id));
    return { workspaceId: invitation.workspaceId };
  });
}
