import { test, expect, vi } from "vitest";
import { reviewDocument } from "../packages/server/src/pm-os/reviews/review-document";
import { getRuntime } from "../packages/server/src/codex/runtime";
import { pmFixture } from "./pm/fixture";
import { pmRuntime } from "./pm/fake-runtime";
vi.mock("../packages/server/src/codex/runtime", () => ({
  getRuntime: vi.fn(),
}));
test("sept perspectives indépendantes, trois simultanées et résultats réutilisés", async () => {
  const f = await pmFixture(),
    rt = pmRuntime();
  vi.mocked(getRuntime).mockResolvedValue(rt.runtime);
  const controller = new AbortController();
  const panel = reviewDocument(
    f.userId,
    f.conversationId,
    f.runId,
    { pageId: f.page.id },
    controller.signal,
  );
  await vi.waitFor(() => expect(rt.starts).toHaveLength(3));
  let finished = 0;
  while (finished < 7) {
    const started = rt.starts.slice(finished);
    expect(started.length).toBeLessThanOrEqual(3);
    for (const thread of started) {
      rt.fake.emit("item/completed", {
        threadId: thread.threadId,
        item: {
          type: "agentMessage",
          id: "review",
          text: "Force : objectif. Objection : hypothèse non mesurée. Question à regrouper : quel seuil ?",
        },
      });
      rt.fake.emit("turn/completed", {
        threadId: thread.threadId,
        turn: { status: "completed" },
      });
      finished++;
    }
    if (finished < 7)
      await vi.waitFor(() =>
        expect(rt.starts.length).toBeGreaterThan(finished),
      );
  }
  const result = await panel;
  expect(result.reviews).toHaveLength(7);
  expect(new Set(rt.threads.map((thread) => thread.id)).size).toBe(7);
  expect(new Set(rt.threads.map((thread) => thread.instructions)).size).toBe(7);
  expect(result.reviews.every((review) => review.status === "completed")).toBe(
    true,
  );
  await reviewDocument(
    f.userId,
    f.conversationId,
    f.runId,
    { pageId: f.page.id },
    controller.signal,
  );
  expect(rt.starts).toHaveLength(7);
});
test("l’arrêt interrompt les trois relecteurs actifs sans lancer les quatre suivants", async () => {
  const f = await pmFixture(),
    rt = pmRuntime();
  vi.mocked(getRuntime).mockResolvedValue(rt.runtime);
  const controller = new AbortController();
  const panel = reviewDocument(
    f.userId,
    f.conversationId,
    f.runId,
    { pageId: f.page.id },
    controller.signal,
  );
  void panel.catch(() => {});
  await vi.waitFor(() => expect(rt.starts).toHaveLength(3));
  controller.abort();
  await expect(panel).rejects.toThrow();
  expect(rt.interrupted).toHaveLength(3);
  expect(rt.starts).toHaveLength(3);
});
