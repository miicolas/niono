import { test, expect } from "vitest";
import { db, schema as s } from "../packages/db/src";
import { eq } from "drizzle-orm";
import { pmFixture } from "./pm/fixture";
import { workspaceContext } from "../packages/server/src/pm-os/context/workspace-context";
import { createSubject } from "../packages/server/src/pm-os/context/create-subject";
import { configureWorkspace } from "../packages/server/src/pm-os/context/configure-workspace";
import { bindContext } from "../packages/server/src/pm-os/context/bind-context";
import { getPmContext } from "../packages/server/src/pm-os/tools/get-context";
import { prepareConversation } from "../packages/server/src/codex/conversations/prepare-conversation";
import { codexSendSchema } from "../packages/contracts/src/codex";
test("contexte Digitevent idempotent, sujets inférés et portée commune", async () => {
  const f = await pmFixture();
  expect(
    (await configureWorkspace(f.userId, { workspaceId: f.workspaceId }))
      .companyPageId,
  ).toBe(f.settings.companyPageId);
  const ctx = await workspaceContext(f.userId, f.workspaceId, f.page.id);
  expect(ctx.selectedSubjectId).toBe(f.subject.id);
  expect(
    (await workspaceContext(f.userId, f.workspaceId, f.page.id, null))
      .selectedSubjectId,
  ).toBeNull();
  await bindContext(f.userId, {
    workspaceId: f.workspaceId,
    subjectId: f.subject.id,
    pageId: f.page.id,
    role: "research",
  });
  expect(
    (await getPmContext(f.userId, f.conversationId, f.runId)).references,
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        pageId: f.settings.companyPageId,
        role: "company",
      }),
      expect.objectContaining({ pageId: f.page.id, role: "research" }),
    ]),
  );
  expect(
    (
      await createSubject(f.userId, {
        workspaceId: f.workspaceId,
        title: "Réessai",
        requestId: f.subject.id,
      })
    ).id,
  ).toBe(f.subject.id);
});
test("isolation des espaces, références et héritage des droits", async () => {
  const f = await pmFixture(),
    other = await pmFixture();
  await expect(
    workspaceContext(other.userId, f.workspaceId),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
  await expect(
    workspaceContext(f.userId, f.workspaceId, other.page.id),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
  await expect(
    bindContext(f.userId, {
      workspaceId: f.workspaceId,
      pageId: other.page.id,
      role: "reference",
    }),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
  await getPmContext(f.userId, f.conversationId, f.runId);
  await db.delete(s.member).where(eq(s.member.userId, f.userId));
  await expect(
    getPmContext(f.userId, f.conversationId, f.runId),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
});
test("les anciens outils restent dans leur conversation ; continuation liée et pack figé", async () => {
  const f = await pmFixture();
  const legacyId = crypto.randomUUID();
  await db.insert(s.codexConversations).values({
    id: legacyId,
    userId: f.userId,
    workspaceId: f.workspaceId,
    title: "Ancienne discussion",
    sources: [{ pageId: f.page.id, title: f.page.title, revision: 0 }],
  });
  const requestId = crypto.randomUUID();
  await expect(
    prepareConversation(
      f.userId,
      legacyId,
      codexSendSchema.parse({
        workspaceId: f.workspaceId,
        conversationId: legacyId,
        requestId,
        prompt: "/prd-draft",
      }),
    ),
  ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  const prepared = await prepareConversation(
    f.userId,
    requestId,
    codexSendSchema.parse({
      workspaceId: f.workspaceId,
      continueFrom: legacyId,
      requestId,
      prompt: "/prd-draft",
      pageId: f.page.id,
    }),
  );
  expect(prepared.row).toMatchObject({
    continuedFrom: legacyId,
    pmPackVersion: f.pack.version,
    pmSubjectId: f.subject.id,
  });
  const [saved] = await db
    .select()
    .from(s.codexConversations)
    .where(eq(s.codexConversations.id, requestId));
  expect(saved?.sources).toEqual(
    expect.arrayContaining([expect.objectContaining({ pageId: f.page.id })]),
  );
});
