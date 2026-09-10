import { createChartFixture } from "./fixtures/chart-database";
import { beforeAll, expect, test } from "vitest";
import * as pages from "../packages/server/src/pages";
import * as databases from "../packages/server/src/databases";
import { viewSchema } from "../packages/contracts/src";

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

test("les réglages et références survivent à l’enregistrement, la duplication et l’archive", async () => {
  const { exportArchive, importArchive } =
    await import("../packages/server/src/transfer");
  const settings = config({
    type: "horizontalBar",
    aggregation: "sum",
    metricProperty: amountId,
    color: "purple",
  });
  const saved = await databases.saveView(owner, {
    pageId,
    name: "Montants",
    config: settings,
  });
  expect(
    (await databases.getDatabase(owner, pageId)).views.find(
      (v) => v.id === saved.id,
    )?.config,
  ).toEqual(settings);
  await databases.saveView(owner, {
    pageId,
    id: saved.id,
    name: "Montants",
    config: settings,
    expectedRevision: 0,
  });
  await expect(
    databases.saveView(owner, {
      pageId,
      id: saved.id,
      name: "Obsolète",
      config: settings,
      expectedRevision: 0,
    }),
  ).rejects.toMatchObject({ code: "CONFLICT" });
  const assertCopy = async (id: string) => {
    const metadata = await databases.getDatabase(owner, id);
    const copied = metadata.views.find((v) => v.name === "Montants")!.config;
    expect(copied.chart).toMatchObject({
      xProperty: metadata.properties.find((p) => p.name === "Étape graphique")!
        .id,
      metricProperty: metadata.properties.find((p) => p.name === "Montant")!.id,
      type: "horizontalBar",
      color: "purple",
    });
    expect(copied.chart?.xProperty).not.toBe(statusId);
    expect(
      (
        await databases.queryChart(owner, { pageId: id, config: copied })
      ).groups.find((g) => g.key === "a")?.value,
    ).toBe(1830);
  };
  await assertCopy((await pages.duplicatePage(owner, pageId)).id);
  const archive = await exportArchive(owner, pageId, true);
  const target = await pages.createWorkspace(owner, "Import graphiques");
  await importArchive(owner, {
    workspaceId: target.id,
    importId: crypto.randomUUID(),
    archive,
  });
  const imported = (await pages.listPages(owner, target.id)).find(
    (p) => p.title === "Graphiques",
  )!;
  await assertCopy(imported.id);
});

test("supprimer une propriété répare les vues graphiques", async () => {
  const base = await pages.createPage(owner, { workspaceId, kind: "database" });
  const amount = await databases.addProperty(owner, {
    pageId: base.id,
    name: "Nombre",
    type: "number",
    options: [],
  });
  const saved = await databases.saveView(owner, {
    pageId: base.id,
    name: "Calcul",
    config: config({
      xProperty: amount.id,
      metricProperty: amount.id,
      aggregation: "sum",
    }),
  });
  await databases.deleteProperty(owner, {
    pageId: base.id,
    propertyId: amount.id,
    expectedName: amount.name,
  });
  const fixed = (await databases.getDatabase(owner, base.id)).views.find(
    (v) => v.id === saved.id,
  )!.config;
  expect(fixed.chart).toMatchObject({
    xProperty: "title",
    aggregation: "count",
  });
  expect(fixed.chart?.metricProperty).toBeUndefined();
  expect(
    await databases.queryChart(owner, { pageId: base.id, config: fixed }),
  ).toEqual({ groups: [], totalEntries: 0, totalGroups: 0 });
});
