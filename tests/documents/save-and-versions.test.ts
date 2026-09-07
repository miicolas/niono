import { beforeAll, expect, test } from "bun:test";
import type { DocumentNode } from "@/lib/editor/document-node";
import { listVersions } from "@/server/services/documents/list-versions";
import { restoreVersion } from "@/server/services/documents/restore-version";
import { saveDocument } from "@/server/services/documents/save-document";
import { createPage } from "@/server/services/pages/create-page";
import { getPage } from "@/server/services/pages/get-page";
import { documentSchema } from "@/validators/documents";
import { content, createContentFixture } from "../support/content-fixture";

let owner: string;
let editor: string;
let workspaceId: string;

beforeAll(async () => {
  ({ owner, editor, workspaceId } = await createContentFixture());
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
  if (results[0]?.status === "fulfilled") {
    await expect(saveDocument(owner, input)).resolves.toEqual({
      revision: 1,
    });
    await expect(
      saveDocument(owner, { ...input, content: content("Changé") })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  }
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
  await restoreVersion(owner, page.id, versions[0]?.id, 1);
  expect((await getPage(owner, page.id)).document).toMatchObject({
    content: content("Original"),
    revision: 2,
  });
  expect(await listVersions(owner, page.id)).toHaveLength(2);
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
