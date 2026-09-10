import { expect, test } from "vitest";
import { auth } from "../../packages/server/src/auth";
import { createPage } from "../../packages/server/src/pages";
import { db, schema as s } from "../../packages/db/src";
import { eq } from "drizzle-orm";
import { account } from "./account";
import { owner, editor, outsider, organizationId } from "./setup";

test("une invitation exige le bon email vérifié et ne peut pas être rejouée", async () => {
  const recipient = await account("invited");
  const invitation = await auth.api.createInvitation({
    headers: owner.headers,
    body: { organizationId, email: recipient.user.email, role: "viewer" },
  });
  await expect(
    auth.api.acceptInvitation({
      headers: outsider.headers,
      body: { invitationId: invitation.id },
    }),
  ).rejects.toMatchObject({ status: "FORBIDDEN" });
  await expect(
    auth.api.acceptInvitation({
      headers: recipient.headers,
      body: { invitationId: invitation.id },
    }),
  ).rejects.toMatchObject({ status: "FORBIDDEN" });
  await db
    .update(s.user)
    .set({ emailVerified: true })
    .where(eq(s.user.id, recipient.user.id));
  const accepted = await auth.api.acceptInvitation({
    headers: recipient.headers,
    body: { invitationId: invitation.id },
  });
  expect(accepted.member).toMatchObject({
    organizationId,
    userId: recipient.user.id,
    role: "viewer",
  });
  await expect(
    createPage(recipient.user.id, { workspaceId: organizationId }),
  ).rejects.toMatchObject({ code: "FORBIDDEN" });
  await expect(
    auth.api.acceptInvitation({
      headers: recipient.headers,
      body: { invitationId: invitation.id },
    }),
  ).rejects.toBeDefined();
});

test("les invitations annulées et expirées sont refusées et un éditeur ne peut pas inviter", async () => {
  const recipient = await account("cancelled");
  await db
    .update(s.user)
    .set({ emailVerified: true })
    .where(eq(s.user.id, recipient.user.id));
  await expect(
    auth.api.createInvitation({
      headers: editor.headers,
      body: { organizationId, email: recipient.user.email, role: "viewer" },
    }),
  ).rejects.toMatchObject({ status: "FORBIDDEN" });
  const invitation = await auth.api.createInvitation({
    headers: owner.headers,
    body: { organizationId, email: recipient.user.email, role: "viewer" },
  });
  await auth.api.cancelInvitation({
    headers: owner.headers,
    body: { invitationId: invitation.id },
  });
  await expect(
    auth.api.acceptInvitation({
      headers: recipient.headers,
      body: { invitationId: invitation.id },
    }),
  ).rejects.toBeDefined();
  const expired = await auth.api.createInvitation({
    headers: owner.headers,
    body: { organizationId, email: recipient.user.email, role: "viewer" },
  });
  await db
    .update(s.invitation)
    .set({ expiresAt: new Date(Date.now() - 1000) })
    .where(eq(s.invitation.id, expired.id));
  await expect(
    auth.api.acceptInvitation({
      headers: recipient.headers,
      body: { invitationId: expired.id },
    }),
  ).rejects.toBeDefined();
});
