import { db, schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { randomBytes, createHash } from "node:crypto";
import { workspaceRole, lockWorkspace, withPage, missing } from "./access";
import { sendEmail } from "./auth";
export async function workspaceMembers(userId: string, workspaceId: string) {
  await workspaceRole(db, userId, workspaceId);
  return db
    .select({
      id: s.user.id,
      name: s.user.name,
      email: s.user.email,
      role: s.members.role,
    })
    .from(s.members)
    .innerJoin(s.user, eq(s.user.id, s.members.userId))
    .where(eq(s.members.workspaceId, workspaceId));
}
export async function inviteMember(
  userId: string,
  input: { workspaceId: string; email: string; role: "editor" | "viewer" },
) {
  if ((await workspaceRole(db, userId, input.workspaceId)) !== "owner")
    throw new ORPCError("FORBIDDEN");
  const token = randomBytes(32).toString("hex");
  await db
    .insert(s.invitations)
    .values({
      ...input,
      email: input.email.toLowerCase(),
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 7 * 86400000),
    });
  await sendEmail(
    input.email,
    "Votre invitation DigiPM",
    `Vous avez été invité dans un espace DigiPM. Connectez-vous ou inscrivez-vous avec cette adresse, puis ouvrez ce lien :\n${process.env.BETTER_AUTH_URL}/invite?token=${token}`,
  );
  return { ok: true };
}
export async function acceptInvitation(userId: string, token: string) {
  return db.transaction(async (tx) => {
    const [invitation] = await tx
      .select()
      .from(s.invitations)
      .where(
        eq(
          s.invitations.tokenHash,
          createHash("sha256").update(token).digest("hex"),
        ),
      )
      .for("update");
    const [user] = await tx.select().from(s.user).where(eq(s.user.id, userId));
    if (
      !invitation ||
      invitation.acceptedAt ||
      invitation.expiresAt < new Date() ||
      invitation.email !== user?.email.toLowerCase()
    )
      throw missing();
    if (!user.emailVerified)
      throw new ORPCError("FORBIDDEN", {
        message:
          "Vérifiez votre adresse email avant d’accepter cette invitation.",
      });
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
export async function changeRole(
  userId: string,
  input: {
    workspaceId: string;
    memberId: string;
    role: "editor" | "viewer" | "remove";
  },
) {
  return db.transaction(async (tx) => {
    await lockWorkspace(tx, input.workspaceId);
    if ((await workspaceRole(tx, userId, input.workspaceId)) !== "owner")
      throw new ORPCError("FORBIDDEN");
    const old = await workspaceRole(tx, input.memberId, input.workspaceId);
    if (old === "owner")
      throw new ORPCError("BAD_REQUEST", {
        message: "Le propriétaire de l’espace doit être conservé.",
      });
    if (input.role === "remove")
      await tx
        .delete(s.members)
        .where(
          and(
            eq(s.members.workspaceId, input.workspaceId),
            eq(s.members.userId, input.memberId),
          ),
        );
    else
      await tx
        .update(s.members)
        .set({ role: input.role })
        .where(
          and(
            eq(s.members.workspaceId, input.workspaceId),
            eq(s.members.userId, input.memberId),
          ),
        );
    return { ok: true };
  });
}
export async function sharePage(
  userId: string,
  input: {
    pageId: string;
    privateRoot: boolean;
    grants: { userId: string; role: "editor" | "viewer" }[];
  },
) {
  return withPage(userId, input.pageId, async (tx, { page }) => {
    if (page.createdBy !== userId)
      throw new ORPCError("FORBIDDEN", {
        message: "Seul le créateur peut modifier les accès de cette page.",
      });
    for (const grant of input.grants)
      await workspaceRole(tx, grant.userId, page.workspaceId);
    await tx
      .update(s.pages)
      .set({ privateRoot: input.privateRoot })
      .where(eq(s.pages.id, page.id));
    await tx.delete(s.grants).where(eq(s.grants.pageId, page.id));
    if (input.grants.length)
      await tx
        .insert(s.grants)
        .values(input.grants.map((g) => ({ ...g, pageId: page.id })));
    return { ok: true };
  });
}
