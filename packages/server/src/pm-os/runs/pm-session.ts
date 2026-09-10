import { cancelRunQuestions } from "./cancel-run-questions";
import { readRunOutput } from "./read-run-output";
import { persistRunOutput } from "./persist-run-output";
import { db, schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import type { CodexRuntime } from "../../codex/runtime/codex-runtime";
import type { RuntimeEvent } from "../../codex/runtime/shared";
import { conversationFor } from "../../codex/store/conversation-for";
import { runs } from "../../codex/conversations/shared";
import { readPack } from "../pack/read-pack";
import { pmInstructions } from "../pack/instructions";
import { pmDynamicTools } from "../tools/definitions";
import { executePmTool } from "../tools/execute";
import { nativeQuestions } from "../questions/native-questions";
import { activePmRuns, runTasks } from "./live";
import { setRunStatus } from "./set-run-status";
import { buildRunPrompt } from "./build-prompt";
import { recordWebSources } from "./record-web-sources";
export class PmSession {
  readonly controller = new AbortController();
  readonly signal = this.controller.signal;
  private remaining = Math.max(
    60000,
    Math.min(7200000, Number(process.env.PM_OS_RUN_TIMEOUT_MS) || 1800000),
  );
  private activeSince = 0;
  private used = 0;
  private checkpointAt = 0;
  private startup?: Promise<void>;
  private releaseStartup?: () => void;
  private waiting = false;
  private ended = false;
  private threadId: string | null = null;
  private turnId: string | null = null;
  private output = new Map<string, string>();
  private dirty = false;
  private queue = Promise.resolve();
  private timer?: ReturnType<typeof setTimeout>;
  private interval?: ReturnType<typeof setInterval>;
  private dispose = () => {};
  private unbind = () => {};
  private unbindInput = () => {};
  private finalizing?: Promise<void>;
  constructor(
    readonly userId: string,
    readonly conversationId: string,
    readonly runId: string,
    private runtime: CodexRuntime,
    private resuming = false,
  ) {}
  async start() {
    this.startup = new Promise((resolve) => {
      this.releaseStartup = resolve;
    });
    activePmRuns.set(this.runId, this);
    runs.set(this.conversationId, {
      userId: this.userId,
      stop: () => this.stop(),
    });
    try {
      const conversation = await conversationFor(
        this.userId,
        this.conversationId,
      );
      const [run] = await db
        .select()
        .from(s.pmRuns)
        .where(eq(s.pmRuns.id, this.runId));
      if (!run || run.conversationId !== this.conversationId)
        throw new Error("Exécution introuvable.");
      this.used = run.activeMilliseconds;
      this.remaining -= this.used;
      const pack = await readPack(run.packVersion);
      if (!pack)
        throw new Error(
          "Le pack PM-OS de cette conversation est indisponible.",
        );
      this.threadId = conversation.threadId;
      if (this.resuming) {
        const previous = await readRunOutput(this.runId);
        if (previous) this.output.set("previous", previous);
      }
      if (this.threadId)
        await this.runtime.request("thread/resume", {
          threadId: this.threadId,
          cwd: this.runtime.cwd,
          approvalPolicy: "never",
          sandbox: "read-only",
          config: { web_search: "live" },
        });
      else {
        const result = await this.runtime.thread({
          developerInstructions: pmInstructions(pack, run.workflowId),
          dynamicTools: pmDynamicTools,
          config: { web_search: "live" },
        });
        this.threadId = result.thread.id;
        await db
          .update(s.codexConversations)
          .set({ threadId: this.threadId })
          .where(eq(s.codexConversations.id, this.conversationId));
      }
      this.releaseStartup?.();
      if (this.ended) return;
      this.unbind = this.runtime.bind(this.threadId, async (params) => {
        this.signal.throwIfAborted();
        return executePmTool(
          this.userId,
          this.conversationId,
          this.runId,
          params.tool,
          params.arguments,
          params.callId,
          this.signal,
        );
      });
      this.unbindInput =
        this.runtime.bindInput?.(this.threadId, (params) =>
          nativeQuestions(this.userId, this.conversationId, this.runId, params),
        ) ?? (() => {});
      this.dispose = this.runtime.on((event) => this.event(event));
      await this.continue();
      this.interval = setInterval(() => {
        void this.flush().catch(() => this.stop());
      }, 250);
      const prompt = await buildRunPrompt(conversation, run, this.resuming);
      await conversationFor(this.userId, this.conversationId);
      this.signal.throwIfAborted();
      const started = await this.runtime.request<{ turn: { id: string } }>(
        "turn/start",
        {
          threadId: this.threadId,
          environments: [],
          input: [{ type: "text", text: prompt, text_elements: [] }],
        },
      );
      this.turnId = started.turn.id;
      if (this.ended)
        await this.runtime
          .request("turn/interrupt", {
            threadId: this.threadId,
            turnId: this.turnId,
          })
          .catch(() => {});
    } catch (error) {
      this.releaseStartup?.();
      await this.finish(
        "failed",
        error instanceof Error ? error.message : "Codex est indisponible.",
      );
    }
  }
  async pause() {
    if (this.ended) throw new Error("Exécution arrêtée.");
    if (!this.waiting) await this.checkpoint();
    this.waiting = true;
    clearTimeout(this.timer);
    await setRunStatus(this.runId, this.conversationId, "awaiting_input");
  }
  private async checkpoint() {
    if (this.activeSince && !this.waiting) {
      const elapsed = Math.max(0, Date.now() - this.activeSince);
      this.remaining -= elapsed;
      this.used += elapsed;
      this.activeSince = Date.now();
      await db
        .update(s.pmRuns)
        .set({ activeMilliseconds: this.used })
        .where(eq(s.pmRuns.id, this.runId));
    }
    this.checkpointAt = Date.now();
  }
  async continue() {
    if (this.ended) return;
    this.waiting = false;
    this.activeSince = Date.now();
    clearTimeout(this.timer);
    await setRunStatus(this.runId, this.conversationId, "running");
    this.timer = setTimeout(
      () => {
        void this.stop();
      },
      Math.max(1, this.remaining),
    );
  }
  async stop() {
    if (this.threadId && this.turnId && !this.ended)
      void this.runtime
        .request("turn/interrupt", {
          threadId: this.threadId,
          turnId: this.turnId,
        })
        .catch(() => {});
    const finishing = this.finish("interrupted");
    await this.startup;
    await finishing;
  }
  private event(event: RuntimeEvent) {
    if (this.ended) return;
    if (event.method === "runtime/closed") {
      void this.finish(
        "failed",
        "Codex s’est arrêté. Vos réponses et livrables sont conservés.",
      );
      return;
    }
    const p = event.params;
    if (p.threadId !== this.threadId) return;
    if (
      event.method === "item/agentMessage/delta" &&
      typeof p.itemId === "string" &&
      typeof p.delta === "string"
    ) {
      this.output.set(p.itemId, (this.output.get(p.itemId) ?? "") + p.delta);
      this.dirty = true;
      if ([...this.output.values()].join("").length > 120000) void this.stop();
    }
    if (
      event.method === "item/completed" &&
      p.item &&
      typeof p.item === "object"
    ) {
      const item = p.item as Record<string, unknown>;
      if (
        item.type === "agentMessage" &&
        typeof item.id === "string" &&
        typeof item.text === "string"
      ) {
        this.output.set(item.id, item.text);
        this.dirty = true;
      }
      if (item.type === "webSearch")
        void recordWebSources(
          this.userId,
          this.conversationId,
          this.runId,
          item,
        ).catch(() => {});
    }
    if (event.method === "turn/completed") {
      const turn = p.turn as { status?: string } | undefined;
      void this.finish(
        turn?.status === "completed"
          ? "completed"
          : turn?.status === "interrupted"
            ? "interrupted"
            : "failed",
        turn?.status === "failed"
          ? "La génération a échoué. Vérifiez votre connexion ou votre quota Codex."
          : null,
      );
    }
    if (event.method === "error" && p.willRetry !== true)
      void this.finish(
        "failed",
        "Codex n’a pas pu terminer. Vous pouvez reprendre les étapes sauvegardées.",
      );
  }
  private flush() {
    if (Date.now() - this.checkpointAt > 5000 && !this.waiting)
      void this.checkpoint().catch(() => this.stop());
    if (!this.dirty) return this.queue;
    this.dirty = false;
    const text = [...this.output.values()].join("\n\n").slice(0, 120000);
    this.queue = this.queue.then(() =>
      persistRunOutput(this.userId, this.conversationId, this.runId, text),
    );
    return this.queue;
  }
  private finish(
    status: "completed" | "failed" | "interrupted",
    error: string | null = null,
  ) {
    if (this.finalizing) return this.finalizing;
    this.ended = true;
    const finalStatus =
      this.waiting && status !== "interrupted" ? "awaiting_input" : status;
    this.controller.abort(new Error("La demande a été arrêtée."));
    clearTimeout(this.timer);
    clearInterval(this.interval);
    this.dispose();
    this.unbind();
    this.unbindInput();
    this.finalizing = (async () => {
      try {
        await Promise.allSettled([...(runTasks.get(this.runId) ?? [])]);
        await this.checkpoint().catch(() => {});
        await this.flush().catch(() => {});
        if (status === "interrupted") await cancelRunQuestions(this.runId);
        await setRunStatus(this.runId, this.conversationId, finalStatus, error);
      } finally {
        activePmRuns.delete(this.runId);
        runs.delete(this.conversationId);
      }
    })();
    return this.finalizing;
  }
}
