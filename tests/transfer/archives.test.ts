import { beforeAll, expect, test } from "bun:test";
import { db, schema as s } from "@/db";
import { readAsset } from "@/server/services/assets/read-asset";
import { storeAsset } from "@/server/services/assets/store-asset";
import { addEntry } from "@/server/services/databases/add-entry";
import { addProperty } from "@/server/services/databases/add-property";
import { updateCell } from "@/server/services/databases/update-cell";
import { saveDocument } from "@/server/services/documents/save-document";
import { createPage } from "@/server/services/pages/create-page";
import { getPage } from "@/server/services/pages/get-page";
import { listPages } from "@/server/services/pages/list-pages";
import { createWorkspace } from "@/server/services/workspaces/create-workspace";
import { content, createContentFixture } from "../support/content-fixture";
import { required } from "../support/required";

let owner: string;
let viewer: string;
let workspaceId: string;

beforeAll(async () => {
  ({ owner, viewer, workspaceId } = await createContentFixture());
});

test("un export de sous-arbre se réimporte une fois avec ses fichiers et références remappés", async () => {
  const { exportArchive } = await import(
    "@/server/services/transfer/export-archive"
  );
  const { importArchive } = await import(
    "@/server/services/transfer/import-archive"
  );
  const root = await createPage(owner, {
    workspaceId,
    title: "Archive é 🌿",
  });
  const child = await createPage(owner, {
    workspaceId,
    parentId: root.id,
    title: "Fichier",
  });
  const asset = await storeAsset(
    owner,
    child.id,
    "note.txt",
    new TextEncoder().encode("Portable")
  );
  await saveDocument(owner, {
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
  const target = await createWorkspace(owner, "Import");
  const importId = crypto.randomUUID();
  const input = { workspaceId: target.id, importId, archive };
  const result = await importArchive(owner, input);
  expect(await importArchive(owner, input)).toEqual(result);
  const imported = await listPages(owner, target.id);
  expect(imported.filter((p) => p.title === "Archive é 🌿")).toHaveLength(1);
  const importedChild = required(imported.find((p) => p.title === "Fichier"));
  const document = await getPage(owner, importedChild.id);
  const url = String(document.document.content.content?.[0]?.attrs?.href);
  expect(url).not.toBe(asset.url);
  expect((await readAsset(owner, url.slice(12))).bytes.toString()).toBe(
    "Portable"
  );
});

test("les archives profondes sont rejetées et une ascendance tronquée ne donne aucun accès", async () => {
  const { importArchive } = await import(
    "@/server/services/transfer/import-archive"
  );
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
    })
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  for (const [i, id] of ids.entries()) {
    // biome-ignore lint/nursery/noAwaitInLoop: chaque page référence la précédente comme parent
    await db.insert(s.pages).values({
      id,
      workspaceId,
      parentId: ids[i - 1] ?? null,
      title: "Ancien import profond",
      createdBy: owner,
      privateRoot: i === 0,
    });
  }
  await expect(getPage(viewer, required(ids[31]))).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
});

test("une archive sans fichiers reste importable et les références de fichiers restent attachées à leur entrée", async () => {
  const { exportArchive } = await import(
    "@/server/services/transfer/export-archive"
  );
  const { importArchive } = await import(
    "@/server/services/transfer/import-archive"
  );
  const base = await createPage(owner, { workspaceId, kind: "database" });
  const entry = await addEntry(owner, {
    pageId: base.id,
    title: "Fichiers",
  });
  const other = await addEntry(owner, {
    pageId: base.id,
    title: "Autre entrée",
  });
  const property = await addProperty(owner, {
    pageId: base.id,
    name: "Fichiers",
    type: "files",
    options: [],
  });
  const asset = await storeAsset(
    owner,
    entry.id,
    "note.txt",
    Buffer.from("Bonjour")
  );
  await updateCell(owner, {
    pageId: entry.id,
    propertyId: property.id,
    value: [asset.id],
    expectedRevision: 0,
  });
  const portable = await exportArchive(owner, base.id, false);
  expect(
    portable.values.find((v) => v.propertyId === property.id)?.value
  ).toEqual([]);
  expect(portable.warnings.length).toBeGreaterThan(0);
  await expect(
    importArchive(owner, {
      workspaceId,
      importId: crypto.randomUUID(),
      archive: portable,
    })
  ).resolves.toHaveProperty("pageIds");
  const tampered = await exportArchive(owner, base.id, true);
  required(tampered.assets[0]).pageId = other.id;
  await expect(
    importArchive(owner, {
      workspaceId,
      importId: crypto.randomUUID(),
      archive: tampered,
    })
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
});
