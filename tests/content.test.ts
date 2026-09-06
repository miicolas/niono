import { beforeAll, expect, test } from "vitest";
import { auth } from "../packages/server/src/auth";
import * as pages from "../packages/server/src/pages";
import * as databases from "../packages/server/src/databases";
import * as workspaces from "../packages/server/src/workspaces";
import { storeAsset, readAsset } from "../packages/server/src/assets";
import { db, schema as s } from "../packages/db/src";
import { eq } from "drizzle-orm";
import {
  documentSchema,
  viewSchema,
  type DocumentNode,
} from "../packages/contracts/src";
let owner: string, editor: string, viewer: string, workspaceId: string;
const content = (text: string): DocumentNode => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});
beforeAll(async () => {
  const ids = await Promise.all(
    ["owner", "editor", "viewer"].map(
      async (name) =>
        (
          await auth.api.signUpEmail({
            body: {
              name,
              email: `${name}-${crypto.randomUUID()}@example.test`,
              password: "Test-password-812!",
            },
          })
        ).user.id,
    ),
  );
  [owner, editor, viewer] = ids as [string, string, string];
  workspaceId = (await pages.createWorkspace(owner, "Test contenu")).id;
  await db.insert(s.members).values([
    { workspaceId, userId: editor, role: "editor" },
    { workspaceId, userId: viewer, role: "viewer" },
  ]);
});
test("une seule sauvegarde concurrente réussit et un retry est idempotent", async () => {
  const page = await pages.createPage(owner, { workspaceId });
  const mutationId = crypto.randomUUID();
  const input = {
    pageId: page.id,
    expectedRevision: 0,
    mutationId,
    content: content("Alpha"),
  };
  const results = await Promise.allSettled([
    pages.saveDocument(owner, input),
    pages.saveDocument(editor, {
      ...input,
      mutationId: crypto.randomUUID(),
      content: content("Beta"),
    }),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
  const stored = await pages.getPage(owner, page.id);
  expect(stored.document.revision).toBe(1);
  if (results[0]!.status === "fulfilled") {
    await expect(pages.saveDocument(owner, input)).resolves.toEqual({
      revision: 1,
    });
    await expect(
      pages.saveDocument(owner, { ...input, content: content("Changé") }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  }
});
test("la corbeille masque le sous-arbre, la restauration le récupère, les cycles sont refusés", async () => {
  const parent = await pages.createPage(owner, {
    workspaceId,
    title: "Parent",
  });
  const child = await pages.createPage(owner, {
    workspaceId,
    parentId: parent.id,
    title: "Enfant",
  });
  await expect(
    pages.movePage(owner, { id: parent.id, parentId: child.id }),
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  await pages.trashPage(owner, parent.id);
  await expect(pages.getPage(owner, child.id)).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  expect(
    (await pages.listPages(owner, workspaceId)).some((p) => p.id === child.id),
  ).toBe(false);
  await pages.trashPage(owner, parent.id, true);
  expect((await pages.getPage(owner, child.id)).page.parentId).toBe(parent.id);
});
test("un lecteur ne peut pas modifier et une restriction s’hérite dans le sous-arbre", async () => {
  const parent = await pages.createPage(owner, { workspaceId });
  const child = await pages.createPage(owner, {
    workspaceId,
    parentId: parent.id,
    content: content("Secretunique"),
  });
  await expect(
    pages.saveDocument(viewer, {
      pageId: child.id,
      expectedRevision: 0,
      mutationId: crypto.randomUUID(),
      content: content("x"),
    }),
  ).rejects.toMatchObject({ code: "FORBIDDEN" });
  await workspaces.sharePage(owner, {
    pageId: parent.id,
    privateRoot: true,
    grants: [{ userId: editor, role: "viewer" }],
  });
  await expect(pages.getPage(viewer, child.id)).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  expect(await pages.searchPages(viewer, workspaceId, "Secretunique")).toEqual(
    [],
  );
  expect((await pages.getPage(editor, child.id)).canEdit).toBe(false);
  await expect(pages.trashPage(editor, child.id)).rejects.toMatchObject({
    code: "FORBIDDEN",
  });
});
test("restaurer une version conserve une nouvelle révision et le contenu précédent", async () => {
  const page = await pages.createPage(owner, {
    workspaceId,
    content: content("Original"),
  });
  await pages.saveDocument(owner, {
    pageId: page.id,
    expectedRevision: 0,
    mutationId: crypto.randomUUID(),
    content: content("Modifié"),
  });
  const versions = await pages.listVersions(owner, page.id);
  await pages.restoreVersion(owner, page.id, versions[0]!.id, 1);
  expect((await pages.getPage(owner, page.id)).document).toMatchObject({
    content: content("Original"),
    revision: 2,
  });
  expect(await pages.listVersions(owner, page.id)).toHaveLength(2);
});
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
