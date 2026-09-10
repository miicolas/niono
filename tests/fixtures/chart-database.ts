import { auth } from "../../packages/server/src/auth";
import * as pages from "../../packages/server/src/pages";
import * as databases from "../../packages/server/src/databases";
import { sharePage } from "../../packages/server/src/workspaces";

export async function createChartFixture() {
  let owner: string,
    viewer: string,
    outsider: string,
    workspaceId: string,
    pageId: string;
  let statusId: string, amountId: string, dateId: string;

  const users = await Promise.all(
    ["owner", "viewer", "outsider"].map(
      async (name) =>
        (
          await auth.api.signUpEmail({
            body: {
              name,
              email: `charts-${name}-${crypto.randomUUID()}@example.test`,
              password: "Charts-test-812!",
            },
          })
        ).user.id,
    ),
  );
  owner = users[0]!;
  viewer = users[1]!;
  outsider = users[2]!;
  workspaceId = (await pages.createWorkspace(owner, "Tests graphiques")).id;
  await auth.api.addMember({
    body: { organizationId: workspaceId, userId: viewer, role: "viewer" },
  });
  pageId = (
    await pages.createPage(owner, {
      workspaceId,
      kind: "database",
      title: "Graphiques",
    })
  ).id;
  const status = await databases.addProperty(owner, {
    pageId,
    name: "Étape graphique",
    type: "select",
    options: [
      { id: "a", name: "En cours", color: "blue" },
      { id: "b", name: "Terminé", color: "green" },
    ],
  });
  statusId = status.id;
  amountId = (
    await databases.addProperty(owner, {
      pageId,
      name: "Montant",
      type: "number",
      options: [],
    })
  ).id;
  dateId = (
    await databases.addProperty(owner, {
      pageId,
      name: "Date",
      type: "date",
      options: [],
    })
  ).id;
  for (let i = 0; i < 65; i++) {
    const row = await databases.addEntry(owner, {
      pageId,
      title: `Entrée ${i + 1}`,
    });
    await databases.updateCell(owner, {
      pageId: row.id,
      propertyId: statusId,
      value: i < 60 ? "a" : i < 64 ? "b" : null,
      expectedRevision: 0,
    });
    if (i < 64)
      await databases.updateCell(owner, {
        pageId: row.id,
        propertyId: amountId,
        value: i + 1,
        expectedRevision: 0,
      });
    await databases.updateCell(owner, {
      pageId: row.id,
      propertyId: dateId,
      value: i < 60 ? "2026-09-06" : "2026-10-15",
      expectedRevision: 0,
    });
  }
  const hidden = await databases.addEntry(owner, {
    pageId,
    title: "Entrée privée",
  });
  await sharePage(owner, { pageId: hidden.id, privateRoot: true, grants: [] });
  const trashed = await databases.addEntry(owner, {
    pageId,
    title: "Entrée supprimée",
  });
  await pages.trashPage(owner, trashed.id);

  return {
    owner,
    viewer,
    outsider,
    workspaceId,
    pageId,
    statusId,
    amountId,
    dateId,
  };
}
