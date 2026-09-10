import { createAuth } from "../auth";
import { db, schema as s } from "@digipm/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { missing } from "../access";

export async function ensureWorkspace(userId: string) {
  return db.transaction(async (tx) => {
    // Keep first-space creation idempotent across tabs, using the same connection for Better Auth.
    await tx.select().from(s.user).where(eq(s.user.id, userId)).for("update");
    const [membership] = await tx
      .select()
      .from(s.member)
      .where(eq(s.member.userId, userId))
      .orderBy(s.member.createdAt, s.member.id)
      .limit(1);
    if (membership) return membership.organizationId;
    const workspace = await createAuth(tx).api.createOrganization({
      body: { userId, name: "Mon espace", slug: `espace-${randomUUID()}` },
    });
    if (!workspace) throw missing();
    return workspace.id;
  });
}
