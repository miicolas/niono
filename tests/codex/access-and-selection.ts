import { expect, test } from "vitest";
import { db, schema as s } from "../../packages/db/src/index";
import { and, eq } from "drizzle-orm";
import { getPage } from "../../packages/server/src/pages";
import { executeTool } from "../../packages/server/src/codex/tools";
import { propose } from "../../packages/server/src/codex/proposals";
import { conversationFor } from "../../packages/server/src/codex/store";
import {
  events,
  removeConversation,
} from "../../packages/server/src/codex/conversations";
import { documentText } from "../../packages/contracts/src/index";
import {
  canonicalDocument,
  transformSelection,
} from "../../packages/editor/src/document-transform";
import { auth } from "../../packages/server/src/auth";
import { paragraphDocument as doc } from "../fixtures/paragraph-document";
import { suggestion } from "./suggestion";
import { apply } from "./apply";
import { owner, stranger, workspaceId, pageId, conversationId } from "./setup";

test("lecture seule et révocation d’accès interdisent les mutations et la reprise", async () => {
  await auth.api.addMember({
    body: { organizationId: workspaceId, userId: stranger, role: "viewer" },
  });
  const viewerConversation = crypto.randomUUID();
  await db.insert(s.codexConversations).values({
    id: viewerConversation,
    userId: stranger,
    workspaceId,
    title: "Lecture",
    status: "running",
  });
  await executeTool(
    stranger,
    viewerConversation,
    crypto.randomUUID(),
    "read_page",
    {
      pageId,
    },
  );
  await expect(
    propose(
      stranger,
      viewerConversation,
      crypto.randomUUID(),
      { type: "renamePage", pageId, expectedRevision: 0, title: "Interdit" },
      "Titre",
    ),
  ).rejects.toMatchObject({ code: "FORBIDDEN" });
  await db
    .update(s.pages)
    .set({ privateRoot: true })
    .where(eq(s.pages.id, pageId));
  await expect(
    conversationFor(stranger, viewerConversation),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
  await expect(events(stranger, viewerConversation)).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  // A user can delete their own inaccessible conversation.
  await removeConversation(stranger, viewerConversation);
  const proposed = await suggestion(owner, conversationId, {
    type: "renamePage",
    pageId,
    expectedRevision: 0,
    title: "Nouveau",
  });
  await db
    .update(s.member)
    .set({ role: "viewer" })
    .where(
      and(eq(s.member.organizationId, workspaceId), eq(s.member.userId, owner)),
    );
  await expect(
    apply(owner, conversationId, proposed.proposalId),
  ).rejects.toMatchObject({
    code: "FORBIDDEN",
  });
});

test("une sélection figée peut être remplacée ou insérée et détecte les positions périmées", async () => {
  const selection = { from: 1, to: 8, text: "Bonjour", revision: 0 };
  await db
    .update(s.codexConversations)
    .set({ context: { pageId, selection } })
    .where(eq(s.codexConversations.id, conversationId));
  const proposed = await suggestion(owner, conversationId, {
    type: "selection",
    pageId,
    selection,
    text: "Salut",
  });
  await apply(owner, conversationId, proposed.proposalId);
  expect(documentText((await getPage(owner, pageId)).document.content)).toBe(
    "Salut le monde",
  );
  await expect(
    apply(owner, conversationId, proposed.proposalId, "insert"),
  ).rejects.toMatchObject({
    code: "CONFLICT",
  });
  const original = canonicalDocument(doc("Bonjour le monde"));
  const inserted = transformSelection(
    original,
    selection,
    "Un ajout",
    "insert",
  );
  expect(documentText(inserted)).toBe("Bonjour le monde\nUn ajout");
  expect(inserted.content?.[0]?.attrs?.id).toBe(
    original.content?.[0]?.attrs?.id,
  );
  expect(() =>
    transformSelection(
      original,
      { ...selection, to: 1000 },
      "Erreur",
      "replace",
    ),
  ).toThrow();
});
