import {
  handleServerRequest,
  type InputHandler,
} from "./handle-server-request";
import { type ChildProcessWithoutNullStreams } from "node:child_process";
import { z } from "zod";
import type { ThreadStartParams } from "../protocol/v2/ThreadStartParams";
import type { LoginAccountResponse } from "../protocol/v2/LoginAccountResponse";
import type { GetAccountResponse } from "../protocol/v2/GetAccountResponse";
import type { DynamicToolCallParams } from "../protocol/v2/DynamicToolCallParams";
import { type RuntimeEvent, type ToolHandler, wire } from "./shared";

/** A single private process; no app-server endpoint is exposed to the browser. */
export class CodexRuntime {
  private sequence = 0;
  private pending = new Map<
    number,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  private listeners = new Set<(event: RuntimeEvent) => void>();
  private tools = new Map<string, ToolHandler>();
  private inputs = new Map<string, InputHandler>();
  private buffer = "";
  dead = false;
  private idle: ReturnType<typeof setTimeout> | undefined;
  private touch() {
    clearTimeout(this.idle);
    this.idle = setTimeout(
      () => (this.tools.size || this.inputs.size ? this.touch() : this.close()),
      10 * 60 * 1000,
    );
    this.idle.unref();
  }
  constructor(
    private process: ChildProcessWithoutNullStreams,
    readonly cwd: string,
  ) {
    this.touch();
    process.stdout.setEncoding("utf8");
    process.stdout.on("data", (chunk: string) => {
      this.touch();
      this.buffer += chunk;
      if (this.buffer.length > 8 * 1024 * 1024) return this.close();
      let end: number;
      while ((end = this.buffer.indexOf("\n")) >= 0) {
        const line = this.buffer.slice(0, end);
        this.buffer = this.buffer.slice(end + 1);
        try {
          this.receive(wire.parse(JSON.parse(line)));
        } catch {
          this.close();
        }
      }
    });
    // Raw stderr may contain account or model content. Never send it to HTTP logs.
    process.stderr.resume();
    process.on("error", () => this.fail());
    process.on("exit", () => this.fail());
  }
  private fail() {
    if (this.dead) return;
    this.dead = true;
    clearTimeout(this.idle);
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error("Le processus Codex s’est arrêté. Réessayez."));
    }
    this.pending.clear();
    this.emit({ method: "runtime/closed", params: {} });
  }
  private emit(event: RuntimeEvent) {
    for (const listener of this.listeners) listener(event);
  }
  private send(value: unknown) {
    this.touch();
    if (this.dead) throw new Error("Codex est indisponible.");
    this.process.stdin.write(JSON.stringify(value) + "\n");
  }
  private receive(message: z.infer<typeof wire>) {
    if (message.method && message.id !== undefined) {
      void handleServerRequest(
        { id: message.id, method: message.method, params: message.params },
        this.tools,
        this.inputs,
        (value) => this.send(value),
      ).catch(() => {});
    } else if (message.method) {
      this.emit({ method: message.method, params: message.params ?? {} });
    } else if (typeof message.id === "number") {
      const request = this.pending.get(message.id);
      if (!request) return;
      clearTimeout(request.timer);
      this.pending.delete(message.id);
      if (message.error)
        request.reject(
          new Error(
            "Codex a refusé la demande. Vérifiez votre connexion et vos limites d’utilisation.",
          ),
        );
      else request.resolve(message.result);
    }
  }
  request<T = unknown>(
    method: string,
    params: unknown = {},
    timeout = 30000,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = ++this.sequence;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("Codex met trop de temps à répondre. Réessayez."));
      }, timeout);
      this.pending.set(id, {
        resolve: (value) => resolve(value as T),
        reject,
        timer,
      });
      try {
        this.send({ id, method, params });
      } catch (e) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(e);
      }
    });
  }
  async initialize() {
    await this.request("initialize", {
      clientInfo: { name: "digipm", title: "DigiPM", version: "1.0.0" },
      capabilities: { experimentalApi: true },
    });
    this.send({ method: "initialized" });
  }
  on(listener: (event: RuntimeEvent) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  bind(threadId: string, handler: ToolHandler) {
    this.tools.set(threadId, handler);
    return () => {
      this.tools.delete(threadId);
    };
  }
  bindInput(threadId: string, handler: InputHandler) {
    this.inputs.set(threadId, handler);
    return () => {
      this.inputs.delete(threadId);
    };
  }
  account() {
    return this.request<GetAccountResponse>("account/read", {
      refreshToken: false,
    });
  }
  login() {
    return this.request<LoginAccountResponse>("account/login/start", {
      type: "chatgptDeviceCode",
    });
  }
  async thread(
    params: Pick<
      ThreadStartParams,
      "developerInstructions" | "dynamicTools" | "config"
    >,
  ) {
    const options: ThreadStartParams = {
      ...params,
      cwd: this.cwd,
      environments: [],
      runtimeWorkspaceRoots: [],
      selectedCapabilityRoots: [],
      approvalPolicy: "never",
      sandbox: "read-only",
      serviceName: "digipm",
      ephemeral: false,
    };
    return this.request<{ thread: { id: string } }>("thread/start", options);
  }
  close() {
    this.fail();
    this.process.kill("SIGTERM");
    const kill = setTimeout(() => this.process.kill("SIGKILL"), 2000);
    kill.unref();
  }
}
