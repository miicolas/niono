import { expect, test } from "vitest";
import { createPage } from "../../packages/server/src/pages";
import { executeTool } from "../../packages/server/src/codex/tools";
import { conversationFor } from "../../packages/server/src/codex/store";
import { connectionStatus } from "../../packages/server/src/codex/connection";
import {
  owner,
  stranger,
  otherWorkspaceId,
  pageId,
  conversationId,
} from "./setup";

test("connexion personnelle absente sans démarrer Codex", async () => {
  expect(await connectionStatus(owner)).toMatchObject({
    status: "disconnected",
    login: null,
  });
});

test("recherche et lecture mémorisent des sources et bloquent les autres espaces/utilisateurs", async () => {
  const result = await executeTool(
    owner,
    conversationId,
    crypto.randomUUID(),
    "search_pages",
    { query: "Atlas" },
  );
  expect(result).toEqual(
    expect.arrayContaining([expect.objectContaining({ id: pageId })]),
  );
  expect((await conversationFor(owner, conversationId)).sources).toEqual(
    expect.arrayContaining([expect.objectContaining({ pageId })]),
  );
  await expect(conversationFor(stranger, conversationId)).rejects.toMatchObject(
    { code: "NOT_FOUND" },
  );
  const other = await createPage(stranger, {
    workspaceId: otherWorkspaceId,
    title: "Secret",
  });
  await expect(
    executeTool(owner, conversationId, crypto.randomUUID(), "read_page", {
      pageId: other.id,
    }),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
  await expect(
    executeTool(owner, conversationId, crypto.randomUUID(), "shell", {
      command: "pwd",
    }),
  ).rejects.toThrow("Outil inconnu");
});
