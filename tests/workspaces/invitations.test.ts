import { beforeAll, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, schema as s } from "@/db";
import { acceptInvitation } from "@/server/services/workspaces/accept-invitation";
import { workspaceMembers } from "@/server/services/workspaces/members";
import { createContentFixture } from "../support/content-fixture";

let owner: string;
let workspaceId: string;

beforeAll(async () => {
  ({ owner, workspaceId } = await createContentFixture());
});

test("une invitation exige le bon email vérifié et ne peut pas être rejouée", async () => {
  const { createHash } = await import("node:crypto");
  const invited = (
    await auth.api.signUpEmail({
      body: {
        name: "Invité",
        email: `invite-${crypto.randomUUID()}@example.test`,
        password: "Invite-test-password-2026!",
      },
    })
  ).user;
  const token = crypto.randomUUID();
  await db.insert(s.invitations).values({
    workspaceId,
    email: invited.email,
    role: "viewer",
    tokenHash: createHash("sha256").update(token).digest("hex"),
    expiresAt: new Date(Date.now() + 60_000),
  });
  await expect(acceptInvitation(owner, token)).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  await expect(acceptInvitation(invited.id, token)).rejects.toMatchObject({
    code: "FORBIDDEN",
  });
  await db
    .update(s.user)
    .set({ emailVerified: true })
    .where(eq(s.user.id, invited.id));
  await expect(acceptInvitation(invited.id, token)).resolves.toEqual({
    workspaceId,
  });
  await expect(acceptInvitation(invited.id, token)).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  expect(
    (await workspaceMembers(owner, workspaceId)).find(
      (m) => m.id === invited.id
    )?.role
  ).toBe("viewer");
});
