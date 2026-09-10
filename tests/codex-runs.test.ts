import { ready } from "./fixtures/ready-codex";
import { beforeEach, expect, test, vi } from "vitest";
import { db, schema as s } from "../packages/db/src/index";
import { createWorkspace, createPage } from "../packages/server/src/pages";
import {
  send,
  events,
  interrupt,
  removeConversation,
} from "../packages/server/src/codex/conversations";
import {
  connect,
  connectionStatus,
  disconnect,
} from "../packages/server/src/codex/connection";
import { eq } from "drizzle-orm";

const fake = vi.hoisted(() => {
  const instances = new Map<string, ReturnType<typeof make>>();
  function make() {
    const listeners = new Set<
      (e: { method: string; params: Record<string, unknown> }) => void
    >();
    const handlers = new Map<
      string,
      (p: { tool: string; arguments: unknown }) => Promise<unknown>
    >();
    const state = {
      connected: false,
      started: false,
      resumed: false,
      deleted: false,
      latestThread: "",
      stopped: false,
    };
    return {
      state,
      handlers,
      cwd: "/private-test-runtime",
      dead: false,
      emit: (method: string, params: Record<string, unknown> = {}) => {
        for (const listener of listeners) listener({ method, params });
      },
      on: (
        listener: (e: {
          method: string;
          params: Record<string, unknown>;
        }) => void,
      ) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      bind: (
        id: string,
        handler: (p: { tool: string; arguments: unknown }) => Promise<unknown>,
      ) => {
        handlers.set(id, handler);
        return () => handlers.delete(id);
      },
      account: async () => ({
        account: state.connected
          ? { type: "chatgpt", email: "test@example.test" }
          : null,
      }),
      login: async () => ({
        type: "chatgptDeviceCode",
        loginId: "login-test",
        verificationUrl: "https://auth.openai.com/codex/device",
        userCode: "TEST-1234",
      }),
      thread: async () => {
        state.latestThread = crypto.randomUUID();
        return { thread: { id: state.latestThread } };
      },
      request: async (method: string) => {
        if (method === "turn/start") {
          state.started = true;
          return { turn: { id: "turn-test" } };
        }
        if (method === "thread/resume") state.resumed = true;
        if (method === "thread/delete") state.deleted = true;
        if (method === "turn/interrupt") state.stopped = true;
        if (method === "account/logout") state.connected = false;
        return {};
      },
    };
  }
  return {
    get: (id: string) => {
      let item = instances.get(id);
      if (!item) {
        item = make();
        instances.set(id, item);
      }
      return item;
    },
  };
});
vi.mock("../packages/server/src/codex/runtime", () => ({
  getRuntime: async (id: string) => fake.get(id),
  closeRuntime: async (id: string) => {
    fake.get(id).emit("runtime/closed");
  },
}));
let userId: string, workspaceId: string, pageId: string;
beforeEach(async () => {
  userId = crypto.randomUUID();
  await db.insert(s.user).values({
    id: userId,
    name: "Runtime test",
    email: `${userId}@runtime.test`,
  });
  workspaceId = (await createWorkspace(userId, "Runtime tests")).id;
  pageId = (await createPage(userId, { workspaceId, title: "Plan" })).id;
});

async function begin() {
  await ready(userId, fake.get(userId));
  const response = await send(userId, {
    workspaceId,
    prompt: "Résume cette page",
    requestId: crypto.randomUUID(),
    pageId,
  });
  await vi.waitFor(() => expect(fake.get(userId).state.started).toBe(true));
  return response.conversationId;
}
test("connexion par code, réussite, refus, annulation et isolation des comptes", async () => {
  expect(await connect(userId)).toMatchObject({ userCode: "TEST-1234" });
  expect(await connectionStatus(userId)).toMatchObject({
    status: "connecting",
  });
  fake.get(userId).state.connected = true;
  fake
    .get(userId)
    .emit("account/login/completed", { loginId: "login-test", success: true });
  await vi.waitFor(async () =>
    expect(await connectionStatus(userId)).toMatchObject({
      status: "connected",
    }),
  );
  expect(await connectionStatus(crypto.randomUUID())).toMatchObject({
    status: "disconnected",
  });
  await disconnect(userId);
  expect(await connectionStatus(userId)).toMatchObject({
    status: "disconnected",
  });
  await connect(userId);
  fake
    .get(userId)
    .emit("account/login/completed", { loginId: "login-test", success: false });
  await vi.waitFor(async () =>
    expect(await connectionStatus(userId)).toMatchObject({ status: "error" }),
  );
  await connect(userId);
  await disconnect(userId);
  expect(await connectionStatus(userId)).toMatchObject({
    status: "disconnected",
  });
});
test("génération progressive, historique, idempotence et reprise", async () => {
  await ready(userId, fake.get(userId));
  const requestId = crypto.randomUUID();
  const input = { workspaceId, prompt: "Bonjour", requestId, pageId };
  const first = await send(userId, input);
  expect(await send(userId, input)).toEqual(first);
  await vi.waitFor(() => expect(fake.get(userId).state.started).toBe(true));
  const runtime = fake.get(userId);
  runtime.emit("item/agentMessage/delta", {
    threadId: runtime.state.latestThread,
    itemId: "answer",
    delta: "Bonjour !",
  });
  runtime.emit("turn/completed", {
    threadId: runtime.state.latestThread,
    turn: { status: "completed" },
  });
  await vi.waitFor(async () =>
    expect(
      (await events(userId, first.conversationId)).conversation.status,
    ).toBe("completed"),
  );
  const result = await events(userId, first.conversationId);
  expect(result.messages?.map((m) => m.role)).toEqual(["user", "assistant"]);
  expect(result.messages?.[1]?.text).toBe("Bonjour !");
  await send(userId, {
    workspaceId,
    conversationId: first.conversationId,
    prompt: "Continue",
    requestId: crypto.randomUUID(),
  });
  await vi.waitFor(() => expect(runtime.state.resumed).toBe(true));
  await interrupt(userId, first.conversationId);
  await removeConversation(userId, first.conversationId);
  expect(runtime.state.deleted).toBe(true);
});
test.each(["runtime/closed", "error"])(
  "erreur de processus ou quota : %s",
  async (method) => {
    const id = await begin();
    const runtime = fake.get(userId);
    runtime.emit(method, {
      threadId: runtime.state.latestThread,
      willRetry: false,
    });
    await vi.waitFor(async () =>
      expect((await events(userId, id)).conversation.status).toBe("failed"),
    );
    expect((await events(userId, id)).messages?.at(-1)?.error).toBeTruthy();
  },
);
test("arrêt : aucune proposition tardive n’est acceptée", async () => {
  const id = await begin();
  const runtime = fake.get(userId);
  const handler = runtime.handlers.get(runtime.state.latestThread)!;
  await interrupt(userId, id);
  expect((await events(userId, id)).conversation.status).toBe("interrupted");
  expect(runtime.state.stopped).toBe(true);
  await expect(
    handler({ tool: "read_page", arguments: { pageId } }),
  ).rejects.toThrow("arrêtée");
});
test("révocation pendant génération : aucune lecture ni réponse récupérable", async () => {
  const id = await begin();
  const runtime = fake.get(userId);
  await db.delete(s.member).where(eq(s.member.userId, userId));
  await expect(
    runtime.handlers.get(runtime.state.latestThread)!({
      tool: "read_page",
      arguments: { pageId },
    }),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
  await expect(events(userId, id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  await interrupt(userId, id);
});

test("un code expiré peut être remplacé par une nouvelle connexion", async () => {
  vi.useFakeTimers();
  try {
    await connect(userId);
    await vi.advanceTimersByTimeAsync(600001);
  } finally {
    vi.useRealTimers();
  }
  await vi.waitFor(async () =>
    expect(await connectionStatus(userId)).toMatchObject({ status: "error" }),
  );
  expect(await connect(userId)).toMatchObject({ userCode: "TEST-1234" });
  await disconnect(userId);
});

test("supprimer pendant le démarrage attend puis efface aussi le thread natif", async () => {
  await ready(userId, fake.get(userId));
  const runtime = fake.get(userId);
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  const thread = runtime.thread;
  const startup = vi.spyOn(runtime, "thread").mockImplementation(async () => {
    await blocked;
    return thread();
  });
  const input = {
    workspaceId,
    prompt: "Bonjour",
    requestId: crypto.randomUUID(),
  };
  const { conversationId } = await send(userId, input);
  await vi.waitFor(() => expect(startup).toHaveBeenCalledOnce());
  const removing = removeConversation(userId, conversationId);
  // A concurrent send must not revive the conversation while native deletion is pending.
  const retry = send(userId, {
    ...input,
    conversationId,
    requestId: crypto.randomUUID(),
  });
  release();
  await expect(removing).resolves.toEqual({ deleted: true });
  await expect(retry).rejects.toMatchObject({ code: "NOT_FOUND" });
  expect(runtime.state.deleted).toBe(true);
  expect(runtime.state.started).toBe(false);
  await expect(events(userId, conversationId)).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
});
