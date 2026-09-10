import { expect, test } from "vitest";
import * as pages from "../../packages/server/src/pages";
import * as databases from "../../packages/server/src/databases";
import { viewSchema } from "../../packages/contracts/src";
import { owner, workspaceId } from "./setup";

test("ordre, largeurs et tris restent cohérents après sauvegarde, duplication et import", async () => {
  const { exportArchive, importArchive } =
    await import("../../packages/server/src/transfer");
  const base = await pages.createPage(owner, {
    workspaceId,
    kind: "database",
    title: "Vue portable",
  });
  const property = await databases.addProperty(owner, {
    pageId: base.id,
    name: "Montant",
    type: "number",
    options: [],
  });
  const config = viewSchema.parse({
    columnOrder: [property.id, "title"],
    columnWidths: { [property.id]: 240, title: 300 },
    sorts: [{ propertyId: property.id, direction: "desc" }],
  });
  const saved = await databases.saveView(owner, {
    pageId: base.id,
    name: "Personnalisée",
    config,
  });
  expect(
    (await databases.getDatabase(owner, base.id)).views.find(
      (v) => v.id === saved.id,
    )?.config,
  ).toEqual(config);
  const copied = await pages.duplicatePage(owner, base.id);
  const assertCopy = async (pageId: string) => {
    const metadata = await databases.getDatabase(owner, pageId);
    const newProperty = metadata.properties.find((p) => p.name === "Montant")!;
    expect(newProperty.id).not.toBe(property.id);
    expect(
      metadata.views.find((v) => v.name === "Personnalisée")?.config,
    ).toMatchObject({
      columnOrder: [newProperty.id, "title"],
      columnWidths: { [newProperty.id]: 240, title: 300 },
      sorts: [{ propertyId: newProperty.id, direction: "desc" }],
    });
  };
  await assertCopy(copied.id);
  const archive = await exportArchive(owner, base.id, true);
  const target = await pages.createWorkspace(owner, "Import vues");
  await importArchive(owner, {
    workspaceId: target.id,
    importId: crypto.randomUUID(),
    archive,
  });
  const imported = (await pages.listPages(owner, target.id)).find(
    (p) => p.title === "Vue portable",
  )!;
  await assertCopy(imported.id);
});
