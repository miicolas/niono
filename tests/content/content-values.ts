import { expect, test } from "vitest";
import * as pages from "../../packages/server/src/pages";
import * as databases from "../../packages/server/src/databases";
import * as workspaces from "../../packages/server/src/workspaces";
import { storeAsset, readAsset } from "../../packages/server/src/assets";
import {
  documentSchema,
  viewSchema,
  type DocumentNode,
} from "../../packages/contracts/src";
import { owner, viewer, workspaceId } from "./setup";

test("les valeurs numériques se trient numériquement et les cellules concurrentes sont protégées", async () => {
  const base = await pages.createPage(owner, { workspaceId, kind: "database" });
  const amount = await databases.addProperty(owner, {
    pageId: base.id,
    name: "Budget",
    type: "number",
    options: [],
  });
  const a = await databases.addEntry(owner, { pageId: base.id, title: "Dix" });
  const b = await databases.addEntry(owner, { pageId: base.id, title: "Deux" });
  await databases.updateCell(owner, {
    pageId: a.id,
    propertyId: amount.id,
    value: 10,
    expectedRevision: 0,
  });
  await databases.updateCell(owner, {
    pageId: b.id,
    propertyId: amount.id,
    value: 2,
    expectedRevision: 0,
  });
  await expect(
    databases.updateCell(owner, {
      pageId: a.id,
      propertyId: amount.id,
      value: "100",
      expectedRevision: 1,
    }),
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  await expect(
    databases.updateCell(owner, {
      pageId: a.id,
      propertyId: amount.id,
      value: 100,
      expectedRevision: 0,
    }),
  ).rejects.toMatchObject({ code: "CONFLICT" });
  const result = await databases.queryEntries(owner, {
    pageId: base.id,
    config: viewSchema.parse({ layout: "table", sortBy: amount.id }),
    offset: 0,
    limit: 50,
  });
  expect(result.rows.map((r) => r.title)).toEqual(["Deux", "Dix"]);
  const filtered = await databases.queryEntries(owner, {
    pageId: base.id,
    config: viewSchema.parse({
      layout: "table",
      filters: [{ propertyId: amount.id, operator: "gt", value: "5" }],
    }),
    offset: 0,
    limit: 50,
  });
  expect(filtered.rows.map((r) => r.id)).toEqual([a.id]);
});

test("les fichiers suivent les permissions de leur page et ne font pas confiance au nom", async () => {
  const page = await pages.createPage(owner, { workspaceId });
  const stored = await storeAsset(
    owner,
    page.id,
    "../../image.svg",
    new TextEncoder().encode('<svg onload="alert(1)"></svg>'),
  );
  expect(stored.mime).toBe("application/octet-stream");
  await workspaces.sharePage(owner, {
    pageId: page.id,
    privateRoot: true,
    grants: [],
  });
  await expect(readAsset(viewer, stored.id)).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  expect((await readAsset(owner, stored.id)).asset.name).not.toContain("/");
});

test("les documents dangereux ou trop profonds sont refusés", () => {
  expect(
    documentSchema.safeParse({
      type: "doc",
      content: [{ type: "image", attrs: { src: "javascript:alert(1)" } }],
    }).success,
  ).toBe(false);
  let nested: DocumentNode = { type: "paragraph" };
  for (let i = 0; i < 35; i++)
    nested = { type: "blockquote", content: [nested] };
  expect(
    documentSchema.safeParse({ type: "doc", content: [nested] }).success,
  ).toBe(false);
});

test("dupliquer une base recopie ses entrées et ses valeurs sans partager leurs identifiants", async () => {
  const base = await pages.createPage(owner, {
    workspaceId,
    kind: "database",
    title: "Projets",
  });
  const entry = await databases.addEntry(owner, {
    pageId: base.id,
    title: "Lancement",
  });
  const original = await databases.getDatabase(owner, base.id);
  const status = original.properties[0]!;
  await databases.updateCell(owner, {
    pageId: entry.id,
    propertyId: status.id,
    expectedRevision: 0,
    value: "progress",
  });
  const copy = await pages.duplicatePage(owner, base.id);
  const copied = await databases.getDatabase(owner, copy.id);
  const rows = await databases.queryEntries(owner, {
    pageId: copy.id,
    config: viewSchema.parse({ layout: "table" }),
    offset: 0,
    limit: 50,
  });
  expect(copied.source.id).not.toBe(original.source.id);
  expect(rows.rows[0]?.title).toBe("Lancement");
  expect(rows.rows[0]?.id).not.toBe(entry.id);
  expect(rows.rows[0]?.values[copied.properties[0]!.id]?.value).toBe(
    "progress",
  );
});

test("restaurer une sous-page privée ne publie pas son contenu et déplacer exige une confirmation", async () => {
  const parent = await pages.createPage(owner, { workspaceId });
  const child = await pages.createPage(owner, {
    workspaceId,
    parentId: parent.id,
  });
  await workspaces.sharePage(owner, {
    pageId: parent.id,
    privateRoot: true,
    grants: [],
  });
  await expect(
    pages.movePage(owner, { id: child.id, parentId: null }),
  ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  await pages.trashPage(owner, parent.id);
  await expect(pages.trashPage(owner, child.id, true)).rejects.toMatchObject({
    code: "PRECONDITION_FAILED",
  });
  await expect(pages.getPage(viewer, child.id)).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  await pages.trashPage(owner, parent.id, true);
  await pages.movePage(owner, {
    id: child.id,
    parentId: null,
    confirmAudienceChange: true,
    confirmedAudience: (await pages.previewMove(owner, child.id, null))
      .audience,
  });
  expect((await pages.getPage(viewer, child.id)).page.id).toBe(child.id);
});
