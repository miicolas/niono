import { beforeAll, expect, test } from "bun:test";
import { db, schema as s } from "@/db";
import { addEntry } from "@/server/services/databases/add-entry";
import { addProperty } from "@/server/services/databases/add-property";
import { getDatabase } from "@/server/services/databases/get-database";
import { queryEntries } from "@/server/services/databases/query-entries";
import { updateCell } from "@/server/services/databases/update-cell";
import { createPage } from "@/server/services/pages/create-page";
import { viewSchema } from "@/validators/databases";
import { createContentFixture } from "../support/content-fixture";

let owner: string;
let workspaceId: string;

beforeAll(async () => {
  ({ owner, workspaceId } = await createContentFixture());
});

test("les valeurs numériques se trient numériquement et les cellules concurrentes sont protégées", async () => {
  const base = await createPage(owner, { workspaceId, kind: "database" });
  const amount = await addProperty(owner, {
    pageId: base.id,
    name: "Budget",
    type: "number",
    options: [],
  });
  const a = await addEntry(owner, { pageId: base.id, title: "Dix" });
  const b = await addEntry(owner, { pageId: base.id, title: "Deux" });
  await updateCell(owner, {
    pageId: a.id,
    propertyId: amount.id,
    value: 10,
    expectedRevision: 0,
  });
  await updateCell(owner, {
    pageId: b.id,
    propertyId: amount.id,
    value: 2,
    expectedRevision: 0,
  });
  await expect(
    updateCell(owner, {
      pageId: a.id,
      propertyId: amount.id,
      value: "100",
      expectedRevision: 1,
    })
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  await expect(
    updateCell(owner, {
      pageId: a.id,
      propertyId: amount.id,
      value: 100,
      expectedRevision: 0,
    })
  ).rejects.toMatchObject({ code: "CONFLICT" });
  const result = await queryEntries(owner, {
    pageId: base.id,
    config: viewSchema.parse({ layout: "table", sortBy: amount.id }),
    offset: 0,
    limit: 50,
  });
  expect(result.rows.map((r) => r.title)).toEqual(["Deux", "Dix"]);
  const filtered = await queryEntries(owner, {
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

test("les filtres de sélection multiple distinguent une cellule vide et un choix", async () => {
  const base = await createPage(owner, { workspaceId, kind: "database" });
  const prop = await addProperty(owner, {
    pageId: base.id,
    name: "Tags",
    type: "multiSelect",
    options: [{ id: "a", name: "Alpha", color: "gray" }],
  });
  const a = await addEntry(owner, {
    pageId: base.id,
    title: "Avec tag",
  });
  await addEntry(owner, { pageId: base.id, title: "Sans tag" });
  await updateCell(owner, {
    pageId: a.id,
    propertyId: prop.id,
    value: ["a"],
    expectedRevision: 0,
  });
  const query = (operator: "empty" | "contains", value: string) =>
    queryEntries(owner, {
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

test("le calendrier et les colonnes filtrent avant de paginer la source", async () => {
  const page = await createPage(owner, { workspaceId, kind: "database" });
  const status = await addProperty(owner, {
    pageId: page.id,
    name: "Statut",
    type: "status",
    options: [
      { id: "todo", name: "À faire", color: "gray" },
      { id: "done", name: "Fini", color: "green" },
    ],
  });
  const date = await addProperty(owner, {
    pageId: page.id,
    name: "Date",
    type: "date",
    options: [],
  });
  const source = (await getDatabase(owner, page.id)).source;
  const inserted = await db
    .insert(s.pages)
    .values(
      Array.from({ length: 61 }, (_, i) => ({
        workspaceId,
        parentId: page.id,
        createdBy: owner,
        title: `Entrée ${i}`,
        position: i,
      }))
    )
    .returning();
  await db.insert(s.entries).values(
    inserted.map((p, i) => ({
      sourceId: source.id,
      pageId: p.id,
      position: i,
    }))
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
    ])
  );
  const config = viewSchema.parse({ layout: "calendar" });
  const calendar = await queryEntries(owner, {
    pageId: page.id,
    config,
    offset: 0,
    limit: 50,
    scope: { propertyId: date.id, from: "2026-09-01", to: "2026-09-30" },
  });
  expect(calendar.rows.map((r) => r.id)).toEqual([inserted[60]?.id]);
  const column = await queryEntries(owner, {
    pageId: page.id,
    config,
    offset: 0,
    limit: 50,
    scope: { propertyId: status.id, value: "done" },
  });
  expect(column.rows.map((r) => r.id)).toEqual([inserted[60]?.id]);
  const first = await queryEntries(owner, {
    pageId: page.id,
    config,
    offset: 0,
    limit: 50,
    scope: { propertyId: status.id, value: "todo" },
  });
  expect(first.hasMore).toBe(true);
  const second = await queryEntries(owner, {
    pageId: page.id,
    config,
    offset: first.nextOffset,
    limit: 50,
    scope: { propertyId: status.id, value: "todo" },
  });
  expect(second.rows).toHaveLength(10);
  expect(second.hasMore).toBe(false);
});
