import { expect, test } from "vitest";
import * as pages from "../../packages/server/src/pages";
import * as databases from "../../packages/server/src/databases";
import { viewSchema } from "../../packages/contracts/src";
import { owner, editor, viewer, workspaceId } from "./setup";

test("supprimer une propriété nettoie atomiquement ses valeurs et toutes les vues, sans supprimer les pages", async () => {
  const base = await pages.createPage(owner, { workspaceId, kind: "database" });
  const property = await databases.addProperty(owner, {
    pageId: base.id,
    name: "À retirer",
    type: "number",
    options: [],
  });
  const row = await databases.addEntry(owner, {
    pageId: base.id,
    title: "Conservée",
  });
  await databases.updateCell(owner, {
    pageId: row.id,
    propertyId: property.id,
    value: 12,
    expectedRevision: 0,
  });
  const config = viewSchema.parse({
    sorts: [
      { propertyId: property.id, direction: "asc" },
      { propertyId: "title", direction: "desc" },
    ],
    columnOrder: [property.id, "title"],
    columnWidths: { [property.id]: 240, title: 300 },
    hidden: [property.id],
    filters: [{ propertyId: property.id, operator: "gt", value: "0" }],
    groupBy: property.id,
  });
  const saved = await databases.saveView(owner, {
    pageId: base.id,
    name: "Suivi",
    config,
  });
  const input = {
    pageId: base.id,
    propertyId: property.id,
    expectedName: property.name,
  };
  await expect(databases.deleteProperty(viewer, input)).rejects.toMatchObject({
    code: "FORBIDDEN",
  });
  await databases.deleteProperty(editor, input);
  const metadata = await databases.getDatabase(owner, base.id);
  expect(metadata.properties.some((p) => p.id === property.id)).toBe(false);
  const cleaned = metadata.views.find((v) => v.id === saved.id)!;
  expect(cleaned.config).toMatchObject({
    sorts: [{ propertyId: "title", direction: "desc" }],
    columnOrder: ["title"],
    columnWidths: { title: 300 },
    hidden: [],
    filters: [],
  });
  expect(cleaned.config.groupBy).toBeUndefined();
  expect(cleaned.revision).toBe(saved.revision + 1);
  expect(
    (
      await databases.queryEntries(owner, {
        pageId: base.id,
        config: cleaned.config,
        offset: 0,
        limit: 50,
      })
    ).rows[0]?.values[property.id],
  ).toBeUndefined();
  expect((await pages.getPage(owner, row.id)).page.title).toBe("Conservée");
  await expect(
    databases.saveView(owner, {
      pageId: base.id,
      id: saved.id,
      name: saved.name,
      config,
      expectedRevision: saved.revision,
    }),
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  await expect(
    databases.updateCell(owner, {
      pageId: row.id,
      propertyId: property.id,
      value: 2,
      expectedRevision: 1,
    }),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
});

test("renommage et suppression contrôlent la source, les droits et le nom attendu", async () => {
  const base = await pages.createPage(owner, { workspaceId, kind: "database" });
  const other = await pages.createPage(owner, {
    workspaceId,
    kind: "database",
  });
  const property = await databases.addProperty(owner, {
    pageId: base.id,
    name: "Avant",
    type: "text",
    options: [],
  });
  const input = {
    pageId: base.id,
    propertyId: property.id,
    expectedName: "Avant",
    name: "Après",
  };
  await expect(databases.renameProperty(viewer, input)).rejects.toMatchObject({
    code: "FORBIDDEN",
  });
  await expect(
    databases.renameProperty(owner, { ...input, pageId: other.id }),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
  await expect(
    databases.deleteProperty(owner, { ...input, pageId: other.id }),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
  await databases.renameProperty(editor, input);
  await expect(databases.renameProperty(owner, input)).rejects.toMatchObject({
    code: "CONFLICT",
  });
  await expect(databases.deleteProperty(owner, input)).rejects.toMatchObject({
    code: "CONFLICT",
  });
  expect(
    (await databases.getDatabase(owner, base.id)).properties.find(
      (p) => p.id === property.id,
    )?.name,
  ).toBe("Après");
});
