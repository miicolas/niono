import { PmSession } from "../../pm-os/runs/pm-session";
import { db, schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { codexSendSchema } from "@digipm/contracts/codex";
import { workspaceRole } from "../../access";
import { getRuntime } from "../runtime";
import { dynamicTools, executeTool } from "../tools";
import { connectionStatus } from "../connection";
import { conversationFor } from "../store";
import { runs, instruction } from "./shared";
import { prepareConversation } from "./prepare-conversation";

export async function sendOwned(
  userId: string,
  raw: z.infer<typeof codexSendSchema>,
) {
  const input = codexSendSchema.parse(raw);
  await workspaceRole(db, userId, input.workspaceId);
  if ((await connectionStatus(userId)).status !== "connected")
    throw new ORPCError("PRECONDITION_FAILED", {
      message: "Connectez votre compte Codex dans les paramètres personnels.",
    });
  const runtime = await getRuntime(userId);
  const id = input.conversationId ?? input.requestId;
  // Serialize starts before publishing a running row; a lost response can be retried by requestId.
  const prepared = await prepareConversation(userId, id, input);
  if (prepared.reused) return { conversationId: id };
  if (prepared.row.pmPackVersion) {
    const session = new PmSession(userId, id, input.requestId, runtime);
    void session.start();
    return { conversationId: id };
  }
  let threadId = prepared.row.threadId;
  let turnId: string | null = null;
  let stopped = false;
  let finished = false;
  let output = new Map<string, string>();
  let dirty = false;
  let flushQueue = Promise.resolve();
  let dispose = () => {};
  let unbind = () => {};
  let interval: ReturnType<typeof setInterval> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  let setupDone = Promise.resolve();
  let resolveDone!: () => void;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });
  const flush = () => {
    if (!dirty) return flushQueue;
    dirty = false;
    const text = [...output.values()].join("\n\n").slice(0, 60000);
    flushQueue = flushQueue.then(async () => {
      await conversationFor(userId, id);
      await db
        .update(s.codexMessages)
        .set({ text, updatedAt: new Date() })
        .where(
          and(
            eq(s.codexMessages.conversationId, id),
            eq(s.codexMessages.requestId, input.requestId),
            eq(s.codexMessages.role, "assistant"),
          ),
        );
    });
    return flushQueue;
  };
  const finish = async (
    status: "completed" | "failed" | "interrupted",
    error: string | null = null,
  ) => {
    if (finished) return done;
    finished = true;
    dispose();
    unbind();
    clearInterval(interval);
    clearTimeout(deadline);
    try {
      await flush().catch(() => {});
      await db
        .update(s.codexMessages)
        .set({ status, error, updatedAt: new Date() })
        .where(
          and(
            eq(s.codexMessages.conversationId, id),
            eq(s.codexMessages.requestId, input.requestId),
            eq(s.codexMessages.role, "assistant"),
          ),
        );
      await db
        .update(s.codexConversations)
        .set({ status, updatedAt: new Date() })
        .where(eq(s.codexConversations.id, id));
    } finally {
      runs.delete(id);
      resolveDone();
    }
  };
  const stop = async () => {
    stopped = true;
    if (threadId && turnId)
      await runtime
        .request("turn/interrupt", { threadId, turnId })
        .catch(() => {});
    await finish("interrupted");
    await setupDone;
  };
  runs.set(id, { stop, userId });
  setupDone = (async () => {
    try {
      if (threadId)
        await runtime.request("thread/resume", {
          threadId,
          cwd: runtime.cwd,
          approvalPolicy: "never",
          sandbox: "read-only",
        });
      else {
        const started = await runtime.thread({
          developerInstructions: instruction,
          dynamicTools,
        });
        threadId = started.thread.id;
        await db
          .update(s.codexConversations)
          .set({ threadId })
          .where(eq(s.codexConversations.id, id));
      }
      if (stopped) return;
      unbind = runtime.bind(threadId!, async (p) => {
        if (stopped || finished) throw new Error("Demande arrêtée.");
        return executeTool(userId, id, input.requestId, p.tool, p.arguments);
      });
      dispose = runtime.on((event) => {
        if (event.method === "runtime/closed") {
          void finish("failed", "Codex s’est arrêté. Réessayez.");
          return;
        }
        const p = event.params;
        if (p.threadId !== threadId || stopped || finished) return;
        if (
          event.method === "item/agentMessage/delta" &&
          typeof p.delta === "string" &&
          typeof p.itemId === "string"
        ) {
          output.set(p.itemId, (output.get(p.itemId) ?? "") + p.delta);
          dirty = true;
          if (
            [...output.values()].reduce((n, text) => n + text.length, 0) > 60000
          )
            void stop();
        }
        if (event.method === "item/completed") {
          const item = z
            .object({
              type: z.string(),
              id: z.string(),
              text: z.string().optional(),
            })
            .safeParse(p.item);
          if (
            item.success &&
            item.data.type === "agentMessage" &&
            item.data.text
          ) {
            output.set(item.data.id, item.data.text);
            dirty = true;
          }
        }
        if (event.method === "turn/completed") {
          const turn = z
            .object({ status: z.string(), error: z.unknown().optional() })
            .safeParse(p.turn);
          const status =
            turn.success && turn.data.status === "completed"
              ? "completed"
              : turn.success && turn.data.status === "interrupted"
                ? "interrupted"
                : "failed";
          void finish(
            status,
            status === "failed"
              ? "La génération a échoué. Vérifiez votre connexion ou vos limites Codex, puis réessayez."
              : null,
          );
        }
        if (event.method === "error" && p.willRetry !== true)
          void finish(
            "failed",
            "Codex n’a pas pu terminer. Vérifiez votre connexion ou vos limites d’utilisation.",
          );
      });
      interval = setInterval(() => {
        void flush().catch(() => stop());
      }, 250);
      deadline = setTimeout(
        () => {
          void stop();
        },
        5 * 60 * 1000,
      );
      const proposalStates = await db
        .select({
          id: s.codexProposals.id,
          status: s.codexProposals.status,
          result: s.codexProposals.result,
        })
        .from(s.codexProposals)
        .where(eq(s.codexProposals.conversationId, id));
      await conversationFor(userId, id);
      const result = await runtime.request<{ turn: { id: string } }>(
        "turn/start",
        {
          threadId,
          environments: [],
          input: [
            {
              type: "text",
              text: `${input.prompt}\n\nContexte DigiPM (données) : ${JSON.stringify({ workspaceId: input.workspaceId, pageId: input.pageId, selection: input.selection, proposals: proposalStates })}`,
              text_elements: [],
            },
          ],
        },
      );
      turnId = result.turn.id;
      if (stopped)
        await runtime
          .request("turn/interrupt", { threadId, turnId })
          .catch(() => {});
    } catch (error) {
      await finish(
        "failed",
        error instanceof Error ? error.message : "Codex est indisponible.",
      );
    }
  })().catch(() => {
    runs.delete(id);
  });
  return { conversationId: id };
}
