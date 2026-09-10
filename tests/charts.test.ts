import { createChartFixture } from "./fixtures/chart-database";
import { beforeAll, expect, test } from "vitest";
import * as pages from "../packages/server/src/pages";
import * as databases from "../packages/server/src/databases";
import { chartConfigSchema, viewSchema } from "../packages/contracts/src";

let owner: string,
  viewer: string,
  outsider: string,
  workspaceId: string,
  pageId: string;
let statusId: string, amountId: string, dateId: string;
const config = (chart: Record<string, unknown> = {}) =>
  viewSchema.parse({
    layout: "chart",
    chart: { xProperty: statusId, ...chart },
  });

beforeAll(async () => {
  ({
    owner,
    viewer,
    outsider,
    workspaceId,
    pageId,
    statusId,
    amountId,
    dateId,
  } = await createChartFixture());
});

test("le graphique agrège toute la source autorisée au-delà de la pagination", async () => {
  const chart = await databases.queryChart(viewer, {
    pageId,
    config: config(),
  });
  expect(chart).toEqual({
    totalEntries: 65,
    totalGroups: 3,
    groups: [
      { key: "a", label: "En cours", count: 60, value: 60 },
      { key: "b", label: "Terminé", count: 4, value: 4 },
      { key: null, label: "Sans valeur", count: 1, value: 1 },
    ],
  });
  expect(
    (await databases.queryChart(owner, { pageId, config: config() }))
      .totalEntries,
  ).toBe(66);
  await expect(
    databases.queryChart(outsider, { pageId, config: config() }),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
  await expect(
    databases.saveView(viewer, { pageId, name: "Interdit", config: config() }),
  ).rejects.toMatchObject({ code: "FORBIDDEN" });
});

test("les calculs ignorent les valeurs absentes et conservent zéro et les nombres négatifs", async () => {
  for (const [aggregation, expected] of [
    ["sum", 1830],
    ["average", 30.5],
    ["min", 1],
    ["max", 60],
  ] as const) {
    const chart = await databases.queryChart(viewer, {
      pageId,
      config: config({ aggregation, metricProperty: amountId }),
    });
    expect(chart.groups[0]?.value).toBe(expected);
    expect(chart.groups.find((g) => g.key === null)?.value).toBeNull();
  }
  const base = await pages.createPage(owner, { workspaceId, kind: "database" });
  const amount = await databases.addProperty(owner, {
    pageId: base.id,
    name: "Solde",
    type: "number",
    options: [],
  });
  for (const value of [0, -12]) {
    const row = await databases.addEntry(owner, {
      pageId: base.id,
      title: "Solde",
    });
    await databases.updateCell(owner, {
      pageId: row.id,
      propertyId: amount.id,
      value,
      expectedRevision: 0,
    });
  }
  const result = await databases.queryChart(owner, {
    pageId: base.id,
    config: config({
      xProperty: "title",
      aggregation: "average",
      metricProperty: amount.id,
    }),
  });
  expect(result.groups[0]?.value).toBe(-6);
  const numericGroups = await databases.queryChart(owner, {
    pageId: base.id,
    config: config({ xProperty: amount.id }),
  });
  expect(numericGroups.groups.map((group) => group.key)).toEqual(["-12", "0"]);
});

test("filtres, recherche et détail d’une catégorie gardent les mêmes règles d’accès", async () => {
  const filtered = viewSchema.parse({
    ...config(),
    filterMode: "or",
    filters: [
      { propertyId: amountId, operator: "gt", value: "58" },
      { propertyId: "title", operator: "eq", value: "Entrée 1" },
    ],
  });
  expect(
    (await databases.queryChart(viewer, { pageId, config: filtered }))
      .totalEntries,
  ).toBe(7);
  const detail = await databases.queryEntries(viewer, {
    pageId,
    config: filtered,
    chartBucket: "a",
    offset: 0,
    limit: 50,
  });
  expect(detail.rows.map((r) => r.title).sort()).toEqual([
    "Entrée 1",
    "Entrée 59",
    "Entrée 60",
  ]);
  expect(
    (
      await databases.queryChart(viewer, {
        pageId,
        config: config(),
        query: "Entrée 65",
      })
    ).groups,
  ).toEqual([{ key: null, label: "Sans valeur", count: 1, value: 1 }]);
  expect(
    (
      await databases.queryEntries(viewer, {
        pageId,
        config: config(),
        chartBucket: null,
        offset: 0,
        limit: 50,
      })
    ).rows,
  ).toHaveLength(1);
});

test("les dates se regroupent sans décalage de fuseau et les valeurs se trient", async () => {
  const monthly = config({
    xProperty: dateId,
    dateBucket: "month",
    sort: "valueAsc",
  });
  const result = await databases.queryChart(viewer, {
    pageId,
    config: monthly,
  });
  expect(result.groups.map((g) => [g.key, g.value])).toEqual([
    ["2026-10-01", 5],
    ["2026-09-01", 60],
  ]);
  expect(
    (
      await databases.queryEntries(viewer, {
        pageId,
        config: monthly,
        chartBucket: "2026-10-01",
        offset: 0,
        limit: 50,
      })
    ).rows,
  ).toHaveLength(5);
  const weekly = await databases.queryChart(viewer, {
    pageId,
    config: config({ xProperty: dateId, dateBucket: "week" }),
  });
  expect(weekly.groups[0]?.key).toBe("2026-08-31");
});

test("les références étrangères et les calculs incompatibles sont refusés", async () => {
  expect(chartConfigSchema.safeParse({ aggregation: "sum" }).success).toBe(
    false,
  );
  for (const chart of [
    { xProperty: crypto.randomUUID() },
    { aggregation: "sum", metricProperty: statusId },
  ]) {
    await expect(
      databases.queryChart(owner, { pageId, config: config(chart) }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      databases.saveView(owner, {
        pageId,
        name: "Invalide",
        config: config(chart),
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  }
});

test("la réponse est bornée par catégories sans tronquer les totaux", async () => {
  const base = await pages.createPage(owner, { workspaceId, kind: "database" });
  for (let i = 0; i < 201; i++)
    await databases.addEntry(owner, {
      pageId: base.id,
      title: `Catégorie ${i}`,
    });
  const result = await databases.queryChart(owner, {
    pageId: base.id,
    config: config({ xProperty: "title" }),
  });
  expect(result.groups).toHaveLength(200);
  expect(result.totalGroups).toBe(201);
  expect(result.totalEntries).toBe(201);
});
