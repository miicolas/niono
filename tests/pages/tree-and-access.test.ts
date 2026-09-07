import { beforeAll, expect, test } from "bun:test";
import { addEntry } from "@/server/services/databases/add-entry";
import { getDatabase } from "@/server/services/databases/get-database";
import { queryEntries } from "@/server/services/databases/query-entries";
import { updateCell } from "@/server/services/databases/update-cell";
import { saveDocument } from "@/server/services/documents/save-document";
import { createPage } from "@/server/services/pages/create-page";
import { duplicatePage } from "@/server/services/pages/duplicate-page";
import { getPage } from "@/server/services/pages/get-page";
import { listPages } from "@/server/services/pages/list-pages";
import { movePage } from "@/server/services/pages/move-page";
import { previewMove } from "@/server/services/pages/preview-move";
import { searchPages } from "@/server/services/pages/search-pages";
import { trashPage } from "@/server/services/pages/trash-page";
import { sharePage } from "@/server/services/workspaces/share-page";
import { viewSchema } from "@/validators/databases";
import { content, createContentFixture } from "../support/content-fixture";
import { required } from "../support/required";

let owner: string;
let editor: string;
let viewer: string;
let workspaceId: string;

beforeAll(async () => {
  ({ owner, editor, viewer, workspaceId } = await createContentFixture());
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
  const status = required(original.properties[0]);
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
  expect(rows.rows[0]?.values[copied.properties[0]?.id]?.value).toBe(
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
