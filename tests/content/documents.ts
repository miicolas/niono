import { expect, test } from "vitest";
import * as pages from "../../packages/server/src/pages";
import * as workspaces from "../../packages/server/src/workspaces";
import { paragraphDocument as content } from "../fixtures/paragraph-document";
import { owner, editor, viewer, workspaceId } from "./setup";

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
