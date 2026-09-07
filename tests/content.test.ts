import { eq } from "drizzle-orm";
import { beforeAll, expect, test } from "vitest";
import { auth } from "@/auth";
import { db, schema as s } from "@/db";
import type { DocumentNode } from "@/lib/editor/document-node";
import { readAsset } from "@/server/services/assets/read-asset";
import { storeAsset } from "@/server/services/assets/store-asset";
import { addEntry } from "@/server/services/databases/add-entry";
import { addProperty } from "@/server/services/databases/add-property";
import { getDatabase } from "@/server/services/databases/get-database";
import { queryEntries } from "@/server/services/databases/query-entries";
import { updateCell } from "@/server/services/databases/update-cell";
import { listVersions } from "@/server/services/documents/list-versions";
import { restoreVersion } from "@/server/services/documents/restore-version";
import { saveDocument } from "@/server/services/documents/save-document";
import { createPage } from "@/server/services/pages/create-page";
import { duplicatePage } from "@/server/services/pages/duplicate-page";
import { getPage } from "@/server/services/pages/get-page";
import { listPages } from "@/server/services/pages/list-pages";
import { movePage } from "@/server/services/pages/move-page";
import { previewMove } from "@/server/services/pages/preview-move";
import { searchPages } from "@/server/services/pages/search-pages";
import { trashPage } from "@/server/services/pages/trash-page";
import { acceptInvitation } from "@/server/services/workspaces/accept-invitation";
import { createWorkspace } from "@/server/services/workspaces/create-workspace";
import { workspaceMembers } from "@/server/services/workspaces/members";
import { sharePage } from "@/server/services/workspaces/share-page";
import { viewSchema } from "@/validators/databases";
import { documentSchema } from "@/validators/documents";

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
        ).user.id
    )
  );
  [owner, editor, viewer] = ids as [string, string, string];
  workspaceId = (await createWorkspace(owner, "Test contenu")).id;
  await db.insert(s.members).values([
    { workspaceId, userId: editor, role: "editor" },
    { workspaceId, userId: viewer, role: "viewer" },
  ]);
});
test("une seule sauvegarde concurrente réussit et un retry est idempotent", async () => {
  const page = await createPage(owner, { workspaceId });
  const mutationId = crypto.randomUUID();
  const input = {
    pageId: page.id,
    expectedRevision: 0,
    mutationId,
    content: content("Alpha"),
  };
  const results = await Promise.allSettled([
    saveDocument(owner, input),
    saveDocument(editor, {
      ...input,
      mutationId: crypto.randomUUID(),
      content: content("Beta"),
    }),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
  const stored = await getPage(owner, page.id);
  expect(stored.document.revision).toBe(1);
  if (results[0]!.status === "fulfilled") {
    await expect(saveDocument(owner, input)).resolves.toEqual({
      revision: 1,
    });
    await expect(
      saveDocument(owner, { ...input, content: content("Changé") })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  }
});
test("la corbeille masque le sous-arbre, la restauration le récupère, les cycles sont refusés", async () => {
  const parent = await createPage(owner, {
    workspaceId,
    title: "Parent",
  });
  const child = await createPage(owner, {
    workspaceId,
    parentId: parent.id,
    title: "Enfant",
  });
  await expect(
    movePage(owner, { id: parent.id, parentId: child.id })
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  await trashPage(owner, parent.id);
  await expect(getPage(owner, child.id)).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  expect(
    (await listPages(owner, workspaceId)).some((p) => p.id === child.id)
  ).toBe(false);
  await trashPage(owner, parent.id, true);
  expect((await getPage(owner, child.id)).page.parentId).toBe(parent.id);
});
test("un lecteur ne peut pas modifier et une restriction s’hérite dans le sous-arbre", async () => {
  const parent = await createPage(owner, { workspaceId });
  const child = await createPage(owner, {
    workspaceId,
    parentId: parent.id,
    content: content("Secretunique"),
  });
  await expect(
    saveDocument(viewer, {
      pageId: child.id,
      expectedRevision: 0,
      mutationId: crypto.randomUUID(),
      content: content("x"),
    })
  ).rejects.toMatchObject({ code: "FORBIDDEN" });
  await sharePage(owner, {
    pageId: parent.id,
    privateRoot: true,
    grants: [{ userId: editor, role: "viewer" }],
  });
  await expect(getPage(viewer, child.id)).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  expect(await searchPages(viewer, workspaceId, "Secretunique")).toEqual([]);
  expect((await getPage(editor, child.id)).canEdit).toBe(false);
  await expect(trashPage(editor, child.id)).rejects.toMatchObject({
    code: "FORBIDDEN",
  });
});
test("restaurer une version conserve une nouvelle révision et le contenu précédent", async () => {
  const page = await createPage(owner, {
    workspaceId,
    content: content("Original"),
  });
  await saveDocument(owner, {
    pageId: page.id,
    expectedRevision: 0,
    mutationId: crypto.randomUUID(),
    content: content("Modifié"),
  });
  const versions = await listVersions(owner, page.id);
  await restoreVersion(owner, page.id, versions[0]!.id, 1);
  expect((await getPage(owner, page.id)).document).toMatchObject({
    content: content("Original"),
    revision: 2,
  });
  expect(await listVersions(owner, page.id)).toHaveLength(2);
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
test("les fichiers suivent les permissions de leur page et ne font pas confiance au nom", async () => {
  const page = await createPage(owner, { workspaceId });
  const stored = await storeAsset(
    owner,
    page.id,
    "../../image.svg",
    new TextEncoder().encode('<svg onload="alert(1)"></svg>')
  );
  expect(stored.mime).toBe("application/octet-stream");
  await sharePage(owner, {
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
    }).success
  ).toBe(false);
  let nested: DocumentNode = { type: "paragraph" };
  for (let i = 0; i < 35; i++) {
    nested = { type: "blockquote", content: [nested] };
  }
  expect(
    documentSchema.safeParse({ type: "doc", content: [nested] }).success
  ).toBe(false);
});
test("dupliquer une base recopie ses entrées et ses valeurs sans partager leurs identifiants", async () => {
  const base = await createPage(owner, {
    workspaceId,
    kind: "database",
    title: "Projets",
  });
  const entry = await addEntry(owner, {
    pageId: base.id,
    title: "Lancement",
  });
  const original = await getDatabase(owner, base.id);
  const status = original.properties[0]!;
  await updateCell(owner, {
    pageId: entry.id,
    propertyId: status.id,
    expectedRevision: 0,
    value: "progress",
  });
  const copy = await duplicatePage(owner, base.id);
  const copied = await getDatabase(owner, copy.id);
  const rows = await queryEntries(owner, {
    pageId: copy.id,
    config: viewSchema.parse({ layout: "table" }),
    offset: 0,
    limit: 50,
  });
  expect(copied.source.id).not.toBe(original.source.id);
  expect(rows.rows[0]?.title).toBe("Lancement");
  expect(rows.rows[0]?.id).not.toBe(entry.id);
  expect(rows.rows[0]?.values[copied.properties[0]!.id]?.value).toBe(
    "progress"
  );
});

test("restaurer une sous-page privée ne publie pas son contenu et déplacer exige une confirmation", async () => {
  const parent = await createPage(owner, { workspaceId });
  const child = await createPage(owner, {
    workspaceId,
    parentId: parent.id,
  });
  await sharePage(owner, {
    pageId: parent.id,
    privateRoot: true,
    grants: [],
  });
  await expect(
    movePage(owner, { id: child.id, parentId: null })
  ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  await trashPage(owner, parent.id);
  await expect(trashPage(owner, child.id, true)).rejects.toMatchObject({
    code: "PRECONDITION_FAILED",
  });
  await expect(getPage(viewer, child.id)).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  await trashPage(owner, parent.id, true);
  await movePage(owner, {
    id: child.id,
    parentId: null,
    confirmAudienceChange: true,
    confirmedAudience: (await previewMove(owner, child.id, null)).audience,
  });
  expect((await getPage(viewer, child.id)).page.id).toBe(child.id);
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
  const importedChild = imported.find((p) => p.title === "Fichier")!;
  const document = await getPage(owner, importedChild.id);
  const url = String(document.document.content.content![0]!.attrs!.href);
  expect(url).not.toBe(asset.url);
  expect((await readAsset(owner, url.slice(12))).bytes.toString()).toBe(
    "Portable"
  );
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
  expect(calendar.rows.map((r) => r.id)).toEqual([inserted[60]!.id]);
  const column = await queryEntries(owner, {
    pageId: page.id,
    config,
    offset: 0,
    limit: 50,
    scope: { propertyId: status.id, value: "done" },
  });
  expect(column.rows.map((r) => r.id)).toEqual([inserted[60]!.id]);
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
    await db.insert(s.pages).values({
      id,
      workspaceId,
      parentId: ids[i - 1] ?? null,
      title: "Ancien import profond",
      createdBy: owner,
      privateRoot: i === 0,
    });
  }
  await expect(getPage(viewer, ids[31]!)).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
});

test("une invitation exige le bon email vérifié et ne peut pas être rejouée", async () => {
  const { createHash } = await import("node:crypto");
  const invited = (
    await auth.api.signUpEmail({
      body: {
        name: "Invité",
        email: `invite-${crypto.randomUUID()}@example.test`,
        password: "Invite-test-password-2026!",
      },
    })
  ).user;
  const token = crypto.randomUUID();
  await db.insert(s.invitations).values({
    workspaceId,
    email: invited.email,
    role: "viewer",
    tokenHash: createHash("sha256").update(token).digest("hex"),
    expiresAt: new Date(Date.now() + 60_000),
  });
  await expect(acceptInvitation(owner, token)).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  await expect(acceptInvitation(invited.id, token)).rejects.toMatchObject({
    code: "FORBIDDEN",
  });
  await db
    .update(s.user)
    .set({ emailVerified: true })
    .where(eq(s.user.id, invited.id));
  await expect(acceptInvitation(invited.id, token)).resolves.toEqual({
    workspaceId,
  });
  await expect(acceptInvitation(invited.id, token)).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  expect(
    (await workspaceMembers(owner, workspaceId)).find(
      (m) => m.id === invited.id
    )?.role
  ).toBe("viewer");
});

test("la confirmation du déplacement refuse une audience qui a changé", async () => {
  const parent = await createPage(owner, { workspaceId });
  const child = await createPage(owner, {
    workspaceId,
    parentId: parent.id,
  });
  await sharePage(owner, {
    pageId: parent.id,
    privateRoot: true,
    grants: [],
  });
  const preview = await previewMove(owner, child.id, null);
  await expect(
    movePage(owner, {
      id: child.id,
      parentId: null,
      confirmAudienceChange: true,
      confirmedAudience: preview.audience.slice(1),
    })
  ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  expect((await getPage(owner, child.id)).page.parentId).toBe(parent.id);
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
  tampered.assets[0]!.pageId = other.id;
  await expect(
    importArchive(owner, {
      workspaceId,
      importId: crypto.randomUUID(),
      archive: tampered,
    })
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
});
