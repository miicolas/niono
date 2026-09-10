import { expect, test } from "vitest";
import { auth, createAuth } from "../packages/server/src/auth";
import { createWorkspace, createPage } from "../packages/server/src/pages";
import { withPage, workspaceRole } from "../packages/server/src/access";
import { db, schema as s } from "../packages/db/src";
import { eq, sql } from "drizzle-orm";

test("une mutation de membre Better Auth attend le verrou d’écriture du contenu", async () => {
  const signup = await auth.api.signUpEmail({
    body: {
      name: "Verrou",
      email: `lock-${crypto.randomUUID()}@example.test`,
      password: "Test-password-812!",
    },
    returnHeaders: true,
  });
  const userId = signup.response.user.id;
  const headers = new Headers({
    cookie: signup.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0])
      .join("; "),
  });
  const workspace = await createWorkspace(userId, "Verrou de contenu");
  const member = (
    await auth.api.listMembers({
      headers,
      query: { organizationId: workspace.id },
    })
  ).members[0]!;
  const page = await createPage(userId, { workspaceId: workspace.id });
  await withPage(userId, page.id, async () => {
    await expect(
      db.transaction(async (tx) => {
        await tx.execute(sql`SET LOCAL lock_timeout = '150ms'`);
        // Even an unchanged owner role must serialize with writes before Better Auth can commit it.
        await createAuth(tx).api.updateMemberRole({
          headers,
          body: {
            organizationId: workspace.id,
            memberId: member.id,
            role: "owner",
          },
        });
      }),
    ).rejects.toMatchObject({ cause: { code: "55P03" } });
  });
  expect(await workspaceRole(db, userId, workspace.id)).toBe("owner");
});

test("accepter une invitation vers une équipe crée les deux appartenances Better Auth", async () => {
  const owner = await auth.api.signUpEmail({
    body: {
      name: "Invitant",
      email: `team-owner-${crypto.randomUUID()}@example.test`,
      password: "Test-password-812!",
    },
    returnHeaders: true,
  });
  const recipient = await auth.api.signUpEmail({
    body: {
      name: "Invité équipe",
      email: `team-invite-${crypto.randomUUID()}@example.test`,
      password: "Test-password-812!",
    },
    returnHeaders: true,
  });
  const ownerHeaders = new Headers({
    cookie: owner.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0])
      .join("; "),
  });
  const recipientHeaders = new Headers({
    cookie: recipient.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0])
      .join("; "),
  });
  await db
    .update(s.user)
    .set({ emailVerified: true })
    .where(eq(s.user.id, recipient.response.user.id));
  const workspace = await createWorkspace(
    owner.response.user.id,
    "Invitation avec équipe",
  );
  const team = await auth.api.createTeam({
    headers: ownerHeaders,
    body: { organizationId: workspace.id, name: "Design" },
  });
  const invitation = await auth.api.createInvitation({
    headers: ownerHeaders,
    body: {
      organizationId: workspace.id,
      teamId: team.id,
      email: recipient.response.user.email,
      role: "editor",
    },
  });
  await auth.api.acceptInvitation({
    headers: recipientHeaders,
    body: { invitationId: invitation.id },
  });
  expect(
    await workspaceRole(db, recipient.response.user.id, workspace.id),
  ).toBe("editor");
  expect(await auth.api.listUserTeams({ headers: recipientHeaders })).toEqual([
    expect.objectContaining({ id: team.id }),
  ]);
  const session = await auth.api.getSession({ headers: recipientHeaders });
  expect(session?.session).toMatchObject({
    activeOrganizationId: workspace.id,
    activeTeamId: team.id,
  });
});
