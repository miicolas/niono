import { beforeAll, expect, test } from "bun:test";
import { readAsset } from "@/server/services/assets/read-asset";
import { storeAsset } from "@/server/services/assets/store-asset";
import { createPage } from "@/server/services/pages/create-page";
import { sharePage } from "@/server/services/workspaces/share-page";
import { createContentFixture } from "../support/content-fixture";

let owner: string;
let viewer: string;
let workspaceId: string;

beforeAll(async () => {
  ({ owner, viewer, workspaceId } = await createContentFixture());
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
