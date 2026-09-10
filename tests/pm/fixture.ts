import { db, schema as s } from "../../packages/db/src";
import { createWorkspace, createPage } from "../../packages/server/src/pages";
import { configureWorkspace } from "../../packages/server/src/pm-os/context/configure-workspace";
import { createSubject } from "../../packages/server/src/pm-os/context/create-subject";
import { fixturePack } from "./fixture-pack";
export async function pmFixture() {
  const pack = await fixturePack();
  const userId = crypto.randomUUID();
  await db
    .insert(s.user)
    .values({ id: userId, name: "PM fixture", email: userId + "@pm.test" });
  const workspaceId = (await createWorkspace(userId, "PM test")).id;
  const settings = await configureWorkspace(userId, { workspaceId });
  const subject = await createSubject(userId, {
    workspaceId,
    title: "Activation Digitevent",
    requestId: crypto.randomUUID(),
  });
  const page = await createPage(userId, {
    workspaceId,
    parentId: subject.pageId,
    title: "Entretien client",
  });
  const conversationId = crypto.randomUUID();
  const runId = crypto.randomUUID();
  await db.insert(s.codexConversations).values({
    id: conversationId,
    workspaceId,
    userId,
    title: "PM fixture",
    status: "running",
    pmPackVersion: pack.version,
    pmSubjectId: subject.id,
    context: { pageId: page.id },
  });
  await db.insert(s.pmRuns).values({
    id: runId,
    conversationId,
    userId,
    workspaceId,
    subjectId: subject.id,
    workflowId: "prd-draft",
    packVersion: pack.version,
  });
  await db.insert(s.codexMessages).values([
    {
      conversationId,
      requestId: runId,
      role: "user",
      text: "Prépare un PRD",
      status: "completed",
    },
    { conversationId, requestId: runId, role: "assistant", status: "running" },
  ]);
  return {
    userId,
    workspaceId,
    settings,
    subject,
    page,
    conversationId,
    runId,
    pack,
  };
}
