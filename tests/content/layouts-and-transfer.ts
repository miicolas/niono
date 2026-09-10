import { expect, test } from "vitest";
import * as pages from "../../packages/server/src/pages";
import * as databases from "../../packages/server/src/databases";
import { storeAsset, readAsset } from "../../packages/server/src/assets";
import { db, schema as s } from "../../packages/db/src";
import { viewSchema } from "../../packages/contracts/src";
import { owner, workspaceId } from "./setup";

test("les filtres de sélection multiple distinguent une cellule vide et un choix", async () => {
  const base = await pages.createPage(owner, { workspaceId, kind: "database" });
  const prop = await databases.addProperty(owner, {
    pageId: base.id,
    name: "Tags",
    type: "multiSelect",
    options: [{ id: "a", name: "Alpha", color: "gray" }],
  });
  const a = await databases.addEntry(owner, {
    pageId: base.id,
    title: "Avec tag",
  });
  await databases.addEntry(owner, { pageId: base.id, title: "Sans tag" });
  await databases.updateCell(owner, {
    pageId: a.id,
    propertyId: prop.id,
    value: ["a"],
    expectedRevision: 0,
  });
  const query = (operator: "empty" | "contains", value: string) =>
    databases.queryEntries(owner, {
      pageId: base.id,
      offset: 0,
      limit: 50,
      config: viewSchema.parse({
        filters: [{ propertyId: prop.id, operator, value }],
      }),
    });
  expect((await query("empty", "")).rows.map((r) => r.title)).toEqual([
    "Sans tag",
  ]);
  expect((await query("contains", "Alpha")).rows.map((r) => r.title)).toEqual([
    "Avec tag",
  ]);
});

test("un export de sous-arbre se réimporte une fois avec ses fichiers et références remappés", async () => {
  const { exportArchive, importArchive } =
    await import("../../packages/server/src/transfer");
  const root = await pages.createPage(owner, {
    workspaceId,
    title: "Archive é 🌿",
  });
  const child = await pages.createPage(owner, {
    workspaceId,
    parentId: root.id,
    title: "Fichier",
  });
  const asset = await storeAsset(
    owner,
    child.id,
    "note.txt",
    new TextEncoder().encode("Portable"),
  );
  await pages.saveDocument(owner, {
    pageId: child.id,
    expectedRevision: 0,
    mutationId: crypto.randomUUID(),
    content: {
      type: "doc",
      content: [{ type: "file", attrs: { href: asset.url, name: "note.txt" } }],
    },
  });
  const archive = await exportArchive(owner, root.id, true);
  expect(archive.pages).toHaveLength(2);
  expect(archive.assets).toHaveLength(1);
  const target = await pages.createWorkspace(owner, "Import");
  const importId = crypto.randomUUID();
  const input = { workspaceId: target.id, importId, archive };
  const result = await importArchive(owner, input);
  expect(await importArchive(owner, input)).toEqual(result);
  const imported = await pages.listPages(owner, target.id);
  expect(imported.filter((p) => p.title === "Archive é 🌿")).toHaveLength(1);
  const importedChild = imported.find((p) => p.title === "Fichier")!;
  const document = await pages.getPage(owner, importedChild.id);
  const url = String(document.document.content.content![0]!.attrs!.href);
  expect(url).not.toBe(asset.url);
  expect((await readAsset(owner, url.slice(12))).bytes.toString()).toBe(
    "Portable",
  );
});

test("le calendrier et les colonnes filtrent avant de paginer la source", async () => {
  const page = await pages.createPage(owner, { workspaceId, kind: "database" });
  const status = await databases.addProperty(owner, {
    pageId: page.id,
    name: "Statut",
    type: "status",
    options: [
      { id: "todo", name: "À faire", color: "gray" },
      { id: "done", name: "Fini", color: "green" },
    ],
  });
  const date = await databases.addProperty(owner, {
    pageId: page.id,
    name: "Date",
    type: "date",
    options: [],
  });
  const source = (await databases.getDatabase(owner, page.id)).source;
  const inserted = await db
    .insert(s.pages)
    .values(
      Array.from({ length: 61 }, (_, i) => ({
        workspaceId,
        parentId: page.id,
        createdBy: owner,
        title: `Entrée ${i}`,
        position: i,
      })),
    )
    .returning();
  await db.insert(s.entries).values(
    inserted.map((p, i) => ({
      sourceId: source.id,
      pageId: p.id,
      position: i,
    })),
  );
  await db.insert(s.values).values(
    inserted.flatMap((p, i) => [
      {
        pageId: p.id,
        propertyId: status.id,
        textValue: i === 60 ? "done" : "todo",
      },
      {
        pageId: p.id,
        propertyId: date.id,
        textValue: i === 60 ? "2026-09-15" : "2026-08-15",
      },
    ]),
  );
  const config = viewSchema.parse({ layout: "calendar" });
  const calendar = await databases.queryEntries(owner, {
    pageId: page.id,
    config,
    offset: 0,
    limit: 50,
    scope: { propertyId: date.id, from: "2026-09-01", to: "2026-09-30" },
  });
  expect(calendar.rows.map((r) => r.id)).toEqual([inserted[60]!.id]);
  const column = await databases.queryEntries(owner, {
    pageId: page.id,
    config,
    offset: 0,
    limit: 50,
    scope: { propertyId: status.id, value: "done" },
  });
  expect(column.rows.map((r) => r.id)).toEqual([inserted[60]!.id]);
  const first = await databases.queryEntries(owner, {
    pageId: page.id,
    config,
    offset: 0,
    limit: 50,
    scope: { propertyId: status.id, value: "todo" },
  });
  expect(first.hasMore).toBe(true);
  const second = await databases.queryEntries(owner, {
    pageId: page.id,
    config,
    offset: first.nextOffset,
    limit: 50,
    scope: { propertyId: status.id, value: "todo" },
  });
  expect(second.rows).toHaveLength(10);
  expect(second.hasMore).toBe(false);
});
