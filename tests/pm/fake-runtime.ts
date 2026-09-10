import type {
  ToolHandler,
  RuntimeEvent,
} from "../../packages/server/src/codex/runtime/shared";
import type { InputHandler } from "../../packages/server/src/codex/runtime/handle-server-request";
import type { CodexRuntime } from "../../packages/server/src/codex/runtime/codex-runtime";
export function pmRuntime() {
  const listeners = new Set<(event: RuntimeEvent) => void>();
  const tools = new Map<string, ToolHandler>();
  const inputs = new Map<string, InputHandler>();
  const threads: { id: string; instructions: string }[] = [];
  const starts: { threadId: string; input: unknown }[] = [];
  const interrupted: string[] = [];
  const deleted: string[] = [];
  const fake = {
    cwd: "/private/pm-test",
    dead: false,
    emit: (method: string, params: Record<string, unknown> = {}) => {
      for (const listener of listeners) listener({ method, params });
    },
    on: (listener: (event: RuntimeEvent) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    bind: (threadId: string, handler: ToolHandler) => {
      tools.set(threadId, handler);
      return () => {
        tools.delete(threadId);
      };
    },
    bindInput: (threadId: string, handler: InputHandler) => {
      inputs.set(threadId, handler);
      return () => {
        inputs.delete(threadId);
      };
    },
    thread: async (params: { developerInstructions?: string }) => {
      const id = crypto.randomUUID();
      threads.push({ id, instructions: params.developerInstructions ?? "" });
      return { thread: { id } };
    },
    request: async (
      method: string,
      params: { threadId: string; input?: unknown },
    ) => {
      if (method === "turn/start") {
        starts.push({ threadId: params.threadId, input: params.input });
        return { turn: { id: crypto.randomUUID() } };
      }
      if (method === "turn/interrupt") interrupted.push(params.threadId);
      if (method === "thread/delete") deleted.push(params.threadId);
      return {};
    },
  };
  return {
    fake,
    runtime: fake as unknown as CodexRuntime,
    tools,
    inputs,
    threads,
    starts,
    interrupted,
    deleted,
  };
}
