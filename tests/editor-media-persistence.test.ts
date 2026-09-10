import { expect, test } from "vitest";
import { auth } from "../packages/server/src/auth";
import * as pages from "../packages/server/src/pages";
import { storeAsset, readAsset } from "../packages/server/src/assets";
import { searchMentionPeople } from "../packages/server/src/pages/search-mention-people";
import { canonicalDocument } from "../packages/editor/src/document-transform";

test("les médias survivent aux sauvegardes, suppressions et copies ; les suggestions respectent l’espace", async () => {
  const [owner, stranger] = await Promise.all(
    ["Média propriétaire", "Média extérieur"].map(
      async (name) =>
        (
          await auth.api.signUpEmail({
            body: {
              name,
              email: `media-${crypto.randomUUID()}@example.test`,
              password: "Test-media-812!",
            },
          })
        ).user.id,
    ),
  );
  const workspaceId = (await pages.createWorkspace(owner!, "Test médias")).id;
  const page = await pages.createPage(owner!, {
    workspaceId,
    title: "Références",
  });
  const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
  const asset = await storeAsset(owner!, page.id, "image.png", png);
  const content = canonicalDocument({
    type: "doc",
    content: [
      {
        type: "image",
        attrs: {
          src: asset.url,
          name: asset.name,
          caption: "Vue du projet",
          width: 350,
          alignment: "left",
        },
      },
      {
        type: "bookmark",
        attrs: {
          href: "https://example.com",
          title: "Documentation",
          description: "Une référence",
        },
      },
      {
        type: "paragraph",
        content: [
          {
            type: "mention",
            attrs: {
              kind: "page",
              referenceId: page.id,
              workspaceId,
              label: "Références",
            },
          },
        ],
      },
    ],
  });
  await pages.saveDocument(owner!, {
    pageId: page.id,
    content,
    expectedRevision: 0,
    mutationId: crypto.randomUUID(),
  });
  expect((await pages.getPage(owner!, page.id)).document.content).toEqual(
    content,
  );
  expect(
    (await searchMentionPeople(owner!, workspaceId, "Média")).map(
      (user) => user.id,
    ),
  ).toEqual([owner]);
  await expect(
    searchMentionPeople(stranger!, workspaceId, ""),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
  await expect(readAsset(stranger!, asset.id)).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  const copy = await pages.duplicatePage(owner!, page.id);
  const copied = (await pages.getPage(owner!, copy.id)).document.content;
  expect(copied.content?.[0]?.attrs).toMatchObject({
    caption: "Vue du projet",
    width: 350,
    alignment: "left",
  });
  expect(copied.content?.[0]?.attrs?.src).not.toBe(asset.url);
  expect(copied.content?.[2]?.content?.[0]?.attrs?.referenceId).toBe(copy.id);
  await pages.saveDocument(owner!, {
    pageId: page.id,
    content: { type: "doc", content: [{ type: "paragraph" }] },
    expectedRevision: 1,
    mutationId: crypto.randomUUID(),
  });
  expect((await readAsset(owner!, asset.id)).bytes).toEqual(Buffer.from(png));
  await pages.saveDocument(owner!, {
    pageId: page.id,
    content,
    expectedRevision: 2,
    mutationId: crypto.randomUUID(),
  });
  expect((await pages.getPage(owner!, page.id)).document.content).toEqual(
    content,
  );
});
