import { expect, test } from "vitest";
import * as pages from "../../packages/server/src/pages";
import * as databases from "../../packages/server/src/databases";
import { viewSchema } from "../../packages/contracts/src";
import { owner, workspaceId } from "./setup";

test("tris multiples et filtres ET/OU sont appliqués avant la pagination", async () => {
  const base = await pages.createPage(owner, { workspaceId, kind: "database" });
  const amount = await databases.addProperty(owner, {
    pageId: base.id,
    name: "Score",
    type: "number",
    options: [],
  });
  for (const [title, value] of [
    ["Alpha", 2],
    ["Zulu", 2],
    ["Beta", 10],
  ] as const) {
    const row = await databases.addEntry(owner, { pageId: base.id, title });
    await databases.updateCell(owner, {
      pageId: row.id,
      propertyId: amount.id,
      value,
      expectedRevision: 0,
    });
  }
  const config = viewSchema.parse({
    sorts: [
      { propertyId: amount.id, direction: "asc" },
      { propertyId: "title", direction: "desc" },
    ],
  });
  const query = (patch = {}) =>
    databases.queryEntries(owner, {
      pageId: base.id,
      config,
      offset: 0,
      limit: 1,
      ...patch,
    });
  expect((await query()).rows.map((r) => r.title)).toEqual(["Zulu"]);
  expect((await query({ offset: 1 })).rows.map((r) => r.title)).toEqual([
    "Alpha",
  ]);
  const filters = [
    { propertyId: amount.id, operator: "gte", value: "10" },
    { propertyId: "title", operator: "startsWith", value: "Al" },
  ];
  expect(
    (
      await query({
        config: viewSchema.parse({ ...config, filters, filterMode: "and" }),
      })
    ).rows,
  ).toEqual([]);
  expect(
    (
      await query({
        limit: 50,
        config: viewSchema.parse({ ...config, filters, filterMode: "or" }),
      })
    ).rows.map((r) => r.title),
  ).toEqual(["Alpha", "Beta"]);
  await expect(
    query({
      config: viewSchema.parse({
        filters: [{ propertyId: amount.id, operator: "contains", value: "2" }],
      }),
    }),
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  await expect(
    query({
      config: viewSchema.parse({
        filters: [{ propertyId: amount.id, operator: "gte", value: "" }],
      }),
    }),
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
});

test("les filtres vides, multiples et textuels respectent les valeurs et les caractères littéraux", async () => {
  const base = await pages.createPage(owner, { workspaceId, kind: "database" });
  const tags = await databases.addProperty(owner, {
    pageId: base.id,
    name: "Étiquettes",
    type: "multiSelect",
    options: [{ id: "one", name: "Un", color: "gray" }],
  });
  const a = await databases.addEntry(owner, {
    pageId: base.id,
    title: "100% fini",
  });
  const b = await databases.addEntry(owner, {
    pageId: base.id,
    title: "1000 fini",
  });
  const c = await databases.addEntry(owner, {
    pageId: base.id,
    title: "Absent",
  });
  await databases.updateCell(owner, {
    pageId: a.id,
    propertyId: tags.id,
    value: ["one"],
    expectedRevision: 0,
  });
  await databases.updateCell(owner, {
    pageId: b.id,
    propertyId: tags.id,
    value: [],
    expectedRevision: 0,
  });
  const query = async (propertyId: string, operator: string, value = "") =>
    (
      await databases.queryEntries(owner, {
        pageId: base.id,
        config: viewSchema.parse({
          filters: [{ propertyId, operator, value }],
        }),
        offset: 0,
        limit: 50,
      })
    ).rows.map((r) => r.id);
  expect(await query(tags.id, "notEmpty")).toEqual([a.id]);
  expect(new Set(await query(tags.id, "empty"))).toEqual(new Set([b.id, c.id]));
  expect(new Set(await query(tags.id, "notContains", "one"))).toEqual(
    new Set([b.id, c.id]),
  );
  expect(await query("title", "contains", "%")).toEqual([a.id]);
  expect(new Set(await query("title", "endsWith", "fini"))).toEqual(
    new Set([a.id, b.id]),
  );
});
