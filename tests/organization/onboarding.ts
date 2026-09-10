import { expect, test } from "vitest";
import { auth } from "../../packages/server/src/auth";
import { ensureWorkspace, listPages } from "../../packages/server/src/pages";
import { account } from "./account";
import { owner, editor, outsider, organizationId } from "./setup";

test("l’onboarding concurrent crée une organisation et un propriétaire Better Auth", async () => {
  const person = await account("onboarding");
  const ids = await Promise.all([
    ensureWorkspace(person.user.id),
    ensureWorkspace(person.user.id),
  ]);
  expect(ids[0]).toBe(ids[1]);
  const organizations = await auth.api.listOrganizations({
    headers: person.headers,
  });
  expect(organizations).toHaveLength(1);
  const members = await auth.api.listMembers({
    headers: person.headers,
    query: { organizationId: ids[0] },
  });
  expect(members.members).toEqual([
    expect.objectContaining({ userId: person.user.id, role: "owner" }),
  ]);
  expect(await listPages(person.user.id, ids[0]!)).toHaveLength(1);
});

test("la création HTTP native initialise aussi le contenu de l’espace", async () => {
  const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const headers = new Headers(owner.headers);
  headers.set("content-type", "application/json");
  headers.set("origin", origin);
  const response = await auth.handler(
    new Request(`${origin}/api/auth/organization/create`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Depuis le client",
        slug: `test-${crypto.randomUUID()}`,
      }),
    }),
  );
  expect(response.status).toBe(200);
  const organization = await response.json();
  expect(await listPages(owner.user.id, organization.id)).toHaveLength(1);
});

test("Better Auth refuse les modifications de membres sans permission et protège le dernier propriétaire", async () => {
  const { members } = await auth.api.listMembers({
    headers: owner.headers,
    query: { organizationId },
  });
  const member = members.find((m) => m.userId === editor.user.id)!;
  const ownerMember = members.find((m) => m.userId === owner.user.id)!;
  await expect(
    auth.api.updateMemberRole({
      headers: editor.headers,
      body: { organizationId, memberId: member.id, role: "owner" },
    }),
  ).rejects.toMatchObject({ status: "FORBIDDEN" });
  await expect(
    auth.api.removeMember({
      headers: owner.headers,
      body: { organizationId, memberIdOrEmail: ownerMember.id },
    }),
  ).rejects.toBeDefined();
  await expect(
    auth.api.updateMemberRole({
      headers: owner.headers,
      body: { organizationId, memberId: ownerMember.id, role: "viewer" },
    }),
  ).rejects.toBeDefined();
  await expect(
    auth.api.listMembers({
      headers: outsider.headers,
      query: { organizationId },
    }),
  ).rejects.toBeDefined();
});
