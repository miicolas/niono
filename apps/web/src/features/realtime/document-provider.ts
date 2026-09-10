import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import { LocalDocument } from "./local-document";
import { client } from "@/lib/api";
import { Base64 } from "./base64";
import { applyPresence } from "./apply-presence";
import type { Presence } from "@digipm/contracts/realtime";

export type CollaborationStatus =
  "saved" | "dirty" | "saving" | "error" | "conflict";

export class DocumentProvider {
  readonly document = new Y.Doc();
  readonly awareness = new Awareness(this.document);
  readonly disk: LocalDocument;
  ready = false;
  canEdit = false;
  revoked = false;
  revision = 0;
  status: CollaborationStatus = "saving";
  diskError = false;
  private vector: Uint8Array | undefined;
  private generation = 0;
  private savedGeneration = 0;
  private pending: Promise<void> | null = null;
  private queued = false;
  private stopped = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private pulse: ReturnType<typeof setInterval>;
  private presenceTimer: ReturnType<typeof setTimeout> | undefined;
  private presenceClock = 0;
  private listeners = new Set<() => void>();
  private syncedListeners = new Set<() => void>();
  private detach: (() => void)[] = [];
  constructor(
    readonly pageId: string,
    readonly user: { id: string; name: string },
    workspaceId: string,
  ) {
    this.awareness.setLocalStateField("user", { ...user, color: "#2563eb" });
    this.disk = new LocalDocument(
      `digipm-crdt:v1:${user.id}:${workspaceId}:${pageId}`,
      this.document,
      (failed) => {
        this.diskError = failed;
        this.notify();
      },
    );
    this.document.on("update", (_update: Uint8Array, origin: unknown) => {
      if (origin === "remote") return;
      this.generation++;
      if (this.ready) {
        this.status = "dirty";
        this.notify();
        this.schedule();
      }
    });
    this.awareness.on("update", (_change: unknown, origin: unknown) => {
      if (origin === "remote" || this.stopped) return;
      if (!this.presenceTimer)
        this.presenceTimer = setTimeout(() => {
          this.presenceTimer = undefined;
          void this.sendPresence();
        }, 50);
      this.notify();
    });
    const listen = (
      name: string,
      callback: (detail: { pageId: string; peers?: Presence[] }) => void,
    ) => {
      const handler = (event: Event) => {
        const detail = (event as CustomEvent).detail;
        if (detail?.pageId === this.pageId) callback(detail);
      };
      window.addEventListener(`digipm:${name}`, handler);
      this.detach.push(() =>
        window.removeEventListener(`digipm:${name}`, handler),
      );
    };
    listen("document", () => {
      if (this.ready) void this.flush();
    });
    listen("presence", ({ peers }) => {
      applyPresence(this.awareness, peers ?? []);
      this.notify();
    });
    listen("offline", () => {
      this.status = "error";
      this.notify();
    });
    listen("revoked", () => {
      this.revoked = true;
      this.canEdit = false;
      this.status = "error";
      this.notify();
    });
    const online = () => void this.flush();
    const guard = (event: BeforeUnloadEvent) => {
      if (this.dirty()) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("online", online);
    window.addEventListener("beforeunload", guard);
    this.detach.push(() => {
      window.removeEventListener("online", online);
      window.removeEventListener("beforeunload", guard);
    });
    this.pulse = setInterval(() => {
      void this.sendPresence();
      if (this.status === "error" || this.dirty()) void this.flush();
    }, 10000);
    void this.disk.load().then(() => this.flush());
  }
  on(_event: "synced", listener: () => void) {
    this.syncedListeners.add(listener);
    if (this.ready)
      queueMicrotask(() => {
        if (!this.stopped && this.syncedListeners.has(listener)) listener();
      });
  }
  off(_event: "synced", listener: () => void) {
    this.syncedListeners.delete(listener);
  }
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  private notify() {
    for (const listener of this.listeners) listener();
  }
  private schedule() {
    if (!this.timer)
      this.timer = setTimeout(() => {
        this.timer = undefined;
        void this.flush();
      }, 25);
  }
  dirty() {
    return this.generation !== this.savedGeneration;
  }
  flush(): Promise<void> {
    if (this.stopped || this.revoked) return Promise.resolve();
    if (this.pending) {
      this.queued = true;
      return this.pending;
    }
    this.pending = (async () => {
      try {
        do {
          this.queued = false;
          const initialized = this.ready;
          const generation = this.generation;
          const update =
            initialized && this.dirty()
              ? Base64.encode(Y.encodeStateAsUpdate(this.document, this.vector))
              : undefined;
          this.status = "saving";
          this.notify();
          const result = await client.realtime.sync({
            pageId: this.pageId,
            vector: Base64.encode(Y.encodeStateVector(this.document)),
            update,
          });
          if (this.stopped) return;
          Y.applyUpdate(this.document, Base64.decode(result.update), "remote");
          this.vector = Base64.decode(result.vector);
          this.revision = result.revision;
          this.canEdit = result.canEdit;
          this.ready = true;
          for (const listener of this.syncedListeners) listener();
          if (initialized) this.savedGeneration = generation;
          else this.generation++;
          this.status = this.dirty() ? "dirty" : "saved";
        } while (this.dirty() || this.queued);
        void this.sendPresence();
      } catch (error) {
        this.status = "error";
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          ["FORBIDDEN", "UNAUTHORIZED", "NOT_FOUND"].includes(
            String(error.code),
          )
        ) {
          this.revoked = true;
          this.canEdit = false;
        }
      } finally {
        this.pending = null;
        this.notify();
      }
    })();
    return this.pending;
  }
  private async sendPresence(active = true) {
    if (!this.ready || this.revoked || (this.stopped && active)) return;
    try {
      await client.realtime.presence({
        pageId: this.pageId,
        clientId: this.document.clientID,
        clock: ++this.presenceClock,
        active,
        cursor: this.awareness.getLocalState()?.cursor ?? null,
      });
    } catch {
      /* Presence is ephemeral; retry on the next heartbeat. */
    }
  }
  destroy() {
    if (this.stopped) return;
    void this.sendPresence(false);
    this.stopped = true;
    clearTimeout(this.timer);
    clearTimeout(this.presenceTimer);
    clearInterval(this.pulse);
    this.detach.forEach((detach) => detach());
    this.listeners.clear();
    this.awareness.destroy();
    void this.disk.destroy().finally(() => this.document.destroy());
  }
}
