import { test, expect, vi } from "vitest";
import { db, schema as s } from "../packages/db/src";
import { eq } from "drizzle-orm";
import { PmSession } from "../packages/server/src/pm-os/runs/pm-session";
import { events, interrupt } from "../packages/server/src/codex/conversations";
import { answerQuestionnaire } from "../packages/server/src/pm-os/questions/answer-questionnaire";
import { activePmRuns } from "../packages/server/src/pm-os/runs/live";
import { pmFixture } from "./pm/fixture";
import { pmRuntime } from "./pm/fake-runtime";
test("reprise après coupure : questionnaire conservé, nouveau tour avec réponses et état sauvegardé", async () => {
  const f = await pmFixture(),
    rt = pmRuntime();
  const session = new PmSession(
    f.userId,
    f.conversationId,
    f.runId,
    rt.runtime,
  );
  await session.start();
  const threadId = rt.threads[0]!.id;
  const waiting = rt.tools.get(threadId)!({
    threadId,
    turnId: "turn",
    callId: "missing",
    namespace: null,
    tool: "ask_questions",
    arguments: {
      title: "Objectif",
      questions: [
        { id: "goal", prompt: "Quel objectif ?", kind: "text", required: true },
      ],
    },
  });
  void waiting.catch(() => {});
  await vi.waitFor(async () =>
    expect((await events(f.userId, f.conversationId)).conversation.status).toBe(
      "awaiting_input",
    ),
  );
  rt.fake.emit("runtime/closed");
  await vi.waitFor(() => expect(activePmRuns.has(f.runId)).toBe(false));
  await expect(waiting).rejects.toThrow();
  const saved = await events(f.userId, f.conversationId);
  expect(saved.resumable).toBe(true);
  const question = saved.pm!.questionnaires[0]!;
  await answerQuestionnaire(f.userId, {
    conversationId: f.conversationId,
    questionnaireId: question.id,
    expectedRevision: 0,
    requestId: crypto.randomUUID(),
    submit: true,
    answers: {
      [question.definition.questions[0]!.id]: {
        selected: [],
        text: "Activation des organisateurs",
        skipped: false,
      },
    },
  });
  const resumed = new PmSession(
    f.userId,
    f.conversationId,
    f.runId,
    rt.runtime,
    true,
  );
  await resumed.start();
  expect(JSON.stringify(rt.starts.at(-1)?.input)).toContain(
    "Activation des organisateurs",
  );
  rt.fake.emit("item/completed", {
    threadId,
    item: {
      type: "webSearch",
      action: { type: "openPage", url: "https://example.com/source" },
    },
  });
  rt.fake.emit("item/agentMessage/delta", {
    threadId,
    itemId: "result",
    delta: "Le PRD est prêt.",
  });
  rt.fake.emit("turn/completed", { threadId, turn: { status: "completed" } });
  await vi.waitFor(async () =>
    expect((await events(f.userId, f.conversationId)).conversation.status).toBe(
      "completed",
    ),
  );
  const completed = await events(f.userId, f.conversationId);
  expect(completed.messages?.at(-1)?.text).toBe("Le PRD est prêt.");
  expect(completed.pm!.runs[0]!.webSources).toEqual([
    { url: "https://example.com/source", title: "example.com" },
  ]);
});
test("temps actif persistant, interruption et impossibilité de répondre ensuite", async () => {
  const f = await pmFixture(),
    rt = pmRuntime();
  await db
    .update(s.pmRuns)
    .set({ activeMilliseconds: 12000 })
    .where(eq(s.pmRuns.id, f.runId));
  const session = new PmSession(
    f.userId,
    f.conversationId,
    f.runId,
    rt.runtime,
    true,
  );
  await session.start();
  await session.pause();
  const [paused] = await db
    .select()
    .from(s.pmRuns)
    .where(eq(s.pmRuns.id, f.runId));
  expect(paused!.activeMilliseconds).toBeGreaterThanOrEqual(12000);
  await new Promise((resolve) => setTimeout(resolve, 30));
  await interrupt(f.userId, f.conversationId);
  const [stopped] = await db
    .select()
    .from(s.pmRuns)
    .where(eq(s.pmRuns.id, f.runId));
  expect(stopped!.activeMilliseconds).toBe(paused!.activeMilliseconds);
  expect(stopped!.status).toBe("interrupted");
  expect(rt.interrupted).toHaveLength(1);
});
