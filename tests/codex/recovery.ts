import { expect, test } from "vitest";
import { createPage } from "../../packages/server/src/pages";
import { executeTool } from "../../packages/server/src/codex/tools";
import { events } from "../../packages/server/src/codex/conversations";
import { auth } from "../../packages/server/src/auth";
import { paragraphDocument as doc } from "../fixtures/paragraph-document";
import { suggestion } from "./suggestion";
import { owner, otherWorkspaceId, conversationId } from "./setup";

test("les événements sont incrémentaux et un redémarrage termine une génération orpheline", async () => {
  const first = await events(owner, conversationId);
  expect(first.conversation.status).toBe("failed");
  const stable = await events(owner, conversationId);
  const next = await events(owner, conversationId, stable.cursor);
  expect(next.changed).toBe(false);
  expect(next.messages).toBeNull();
});

test("un utilisateur membre de deux espaces ne peut pas mélanger leurs outils", async () => {
  await auth.api.addMember({
    body: { organizationId: otherWorkspaceId, userId: owner, role: "editor" },
  });
  const elsewhere = await createPage(owner, {
    workspaceId: otherWorkspaceId,
    title: "Autre contexte",
  });
  await expect(
    executeTool(owner, conversationId, crypto.randomUUID(), "read_page", {
      pageId: elsewhere.id,
    }),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
  await expect(
    suggestion(owner, conversationId, {
      type: "createPage",
      parentId: elsewhere.id,
      title: "Interdit",
      content: doc("Texte"),
    }),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
});
