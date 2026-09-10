import { expect, test } from "vitest";
import { auth } from "../../packages/server/src/auth";
import {
  createWorkspace,
  getPage,
  createPage,
  saveDocument,
} from "../../packages/server/src/pages";
import { account } from "./account";
import { owner, editor, outsider, organizationId } from "./setup";

test("les équipes et leurs membres sont gérés par les endpoints Better Auth", async () => {
  await expect(
    auth.api.createTeam({
      headers: editor.headers,
      body: { organizationId, name: "Interdit" },
    }),
  ).rejects.toMatchObject({ status: "FORBIDDEN" });
  const team = await auth.api.createTeam({
    headers: owner.headers,
    body: { organizationId, name: "Design" },
  });
  await auth.api.addTeamMember({
    headers: owner.headers,
    body: { organizationId, teamId: team.id, userId: owner.user.id },
  });
  await auth.api.addTeamMember({
    headers: owner.headers,
    body: { organizationId, teamId: team.id, userId: editor.user.id },
  });
  expect(
    await auth.api.listOrganizationTeams({
      headers: owner.headers,
      query: { organizationId },
    }),
  ).toEqual(expect.arrayContaining([expect.objectContaining({ id: team.id })]));
  expect(
    await auth.api.listTeamMembers({
      headers: editor.headers,
      query: { teamId: team.id },
    }),
  ).toHaveLength(2);
  await expect(
    auth.api.addTeamMember({
      headers: owner.headers,
      body: { organizationId, teamId: team.id, userId: outsider.user.id },
    }),
  ).rejects.toBeDefined();
  const other = await createWorkspace(outsider.user.id, "Autre organisation");
  await expect(
    auth.api.addTeamMember({
      headers: outsider.headers,
      body: {
        organizationId: other.id,
        teamId: team.id,
        userId: outsider.user.id,
      },
    }),
  ).rejects.toBeDefined();
  await auth.api.removeTeamMember({
    headers: owner.headers,
    body: { organizationId, teamId: team.id, userId: editor.user.id },
  });
  expect(
    await auth.api.listTeamMembers({
      headers: owner.headers,
      query: { teamId: team.id },
    }),
  ).toHaveLength(1);
  await auth.api.removeTeam({
    headers: owner.headers,
    body: { organizationId, teamId: team.id },
  });
  expect(
    await auth.api.listOrganizationTeams({
      headers: owner.headers,
      query: { organizationId },
    }),
  ).toHaveLength(0);
});

test("une révocation Better Auth retire immédiatement l’accès aux pages et aux équipes", async () => {
  const person = await account("revoked");
  const membership = await auth.api.addMember({
    body: { organizationId, userId: person.user.id, role: "editor" },
  });
  const page = await createPage(owner.user.id, { workspaceId: organizationId });
  const team = await auth.api.createTeam({
    headers: owner.headers,
    body: { organizationId, name: "Produit" },
  });
  await auth.api.addTeamMember({
    headers: owner.headers,
    body: { organizationId, teamId: team.id, userId: person.user.id },
  });
  await auth.api.setActiveOrganization({
    headers: person.headers,
    body: { organizationId },
  });
  await auth.api.setActiveTeam({
    headers: person.headers,
    body: { teamId: team.id },
  });
  await auth.api.updateMemberRole({
    headers: owner.headers,
    body: { organizationId, memberId: membership!.id, role: "viewer" },
  });
  expect((await getPage(person.user.id, page.id)).canEdit).toBe(false);
  await expect(
    saveDocument(person.user.id, {
      pageId: page.id,
      expectedRevision: 0,
      mutationId: crypto.randomUUID(),
      content: { type: "doc", content: [{ type: "paragraph" }] },
    }),
  ).rejects.toMatchObject({ code: "FORBIDDEN" });
  await auth.api.removeMember({
    headers: owner.headers,
    body: { organizationId, memberIdOrEmail: membership!.id },
  });
  await expect(getPage(person.user.id, page.id)).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  expect(
    await auth.api.listUserTeams({ headers: person.headers }),
  ).toHaveLength(0);
  await expect(
    auth.api.setActiveOrganization({
      headers: person.headers,
      body: { organizationId },
    }),
  ).rejects.toBeDefined();
});
