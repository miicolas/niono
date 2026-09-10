import { beforeEach } from "vitest";
import { db, schema as s } from "../../packages/db/src/index";
import { createWorkspace, createPage } from "../../packages/server/src/pages";
import { paragraphDocument as doc } from "../fixtures/paragraph-document";

export let owner: string,
  stranger: string,
  workspaceId: string,
  otherWorkspaceId: string,
  pageId: string,
  conversationId: string;

beforeEach(async () => {
  owner = crypto.randomUUID();
  stranger = crypto.randomUUID();
  await db.insert(s.user).values([
    { id: owner, name: "Owner", email: `${owner}@codex.test` },
    { id: stranger, name: "Other", email: `${stranger}@codex.test` },
  ]);
  workspaceId = (await createWorkspace(owner, "Codex tests")).id;
  otherWorkspaceId = (await createWorkspace(stranger, "Other tests")).id;
  pageId = (
    await createPage(owner, {
      workspaceId,
      title: "Projet Atlas",
      content: doc("Bonjour le monde"),
    })
  ).id;
  conversationId = crypto.randomUUID();
  await db.insert(s.codexConversations).values({
    id: conversationId,
    userId: owner,
    workspaceId,
    title: "Essai",
    status: "running",
  });
});
