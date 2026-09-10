import { expect, test } from "vitest";
import * as pages from "../../packages/server/src/pages";
import * as databases from "../../packages/server/src/databases";
import * as workspaces from "../../packages/server/src/workspaces";
import { storeAsset } from "../../packages/server/src/assets";
import { db, schema as s } from "../../packages/db/src";
import { paragraphDocument as content } from "../fixtures/paragraph-document";
import { owner, viewer, workspaceId } from "./setup";

test("les archives profondes sont rejetées et une ascendance tronquée ne donne aucun accès", async () => {
  const { importArchive } = await import("../../packages/server/src/transfer");
  const ids = Array.from({ length: 32 }, () => crypto.randomUUID());
  const archive = {
    format: "digipm-archive" as const,
    version: 1 as const,
    pages: ids.map((id, i) => ({
      id,
      parentId: ids[i - 1] ?? null,
      title: `Niveau ${i}`,
      icon: "📄",
      cover: null,
      kind: "page" as const,
      privateRoot: i === 0,
      content: content("Secret"),
    })),
    sources: [],
    properties: [],
    entries: [],
    values: [],
    views: [],
    assets: [],
    warnings: [],
  };
  await expect(
    importArchive(owner, {
      workspaceId,
      importId: crypto.randomUUID(),
      archive,
    }),
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  for (const [i, id] of ids.entries())
    await db.insert(s.pages).values({
      id,
      workspaceId,
      parentId: ids[i - 1] ?? null,
      title: "Ancien import profond",
      createdBy: owner,
      privateRoot: i === 0,
    });
  await expect(pages.getPage(viewer, ids[31]!)).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
});

test("la confirmation du déplacement refuse une audience qui a changé", async () => {
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
  const preview = await pages.previewMove(owner, child.id, null);
  await expect(
    pages.movePage(owner, {
      id: child.id,
      parentId: null,
      confirmAudienceChange: true,
      confirmedAudience: preview.audience.slice(1),
    }),
  ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  expect((await pages.getPage(owner, child.id)).page.parentId).toBe(parent.id);
});

test("une archive sans fichiers reste importable et les références de fichiers restent attachées à leur entrée", async () => {
  const { exportArchive, importArchive } =
    await import("../../packages/server/src/transfer");
  const base = await pages.createPage(owner, { workspaceId, kind: "database" });
  const entry = await databases.addEntry(owner, {
    pageId: base.id,
    title: "Fichiers",
  });
  const other = await databases.addEntry(owner, {
    pageId: base.id,
    title: "Autre entrée",
  });
  const property = await databases.addProperty(owner, {
    pageId: base.id,
    name: "Fichiers",
    type: "files",
    options: [],
  });
  const asset = await storeAsset(
    owner,
    entry.id,
    "note.txt",
    Buffer.from("Bonjour"),
  );
  await databases.updateCell(owner, {
    pageId: entry.id,
    propertyId: property.id,
    value: [asset.id],
    expectedRevision: 0,
  });
  const portable = await exportArchive(owner, base.id, false);
  expect(
    portable.values.find((v) => v.propertyId === property.id)?.value,
  ).toEqual([]);
  expect(portable.warnings.length).toBeGreaterThan(0);
  await expect(
    importArchive(owner, {
      workspaceId,
      importId: crypto.randomUUID(),
      archive: portable,
    }),
  ).resolves.toHaveProperty("pageIds");
  const tampered = await exportArchive(owner, base.id, true);
  tampered.assets[0]!.pageId = other.id;
  await expect(
    importArchive(owner, {
      workspaceId,
      importId: crypto.randomUUID(),
      archive: tampered,
    }),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
});
