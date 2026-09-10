import * as Y from "yjs";
import { get, update } from "idb-keyval";

/** Serializes durable snapshots; a storage failure never masquerades as a saved draft. */
export class LocalDocument {
  private generation = 0;
  private saved = 0;
  private pending: Promise<void> | null = null;
  private stopped = false;
  private changed = () => {
    this.generation++;
    void this.flush();
  };
  constructor(
    private key: string,
    private document: Y.Doc,
    private onError: (failed: boolean) => void,
  ) {}
  async load() {
    try {
      const state = await get<Uint8Array>(this.key);
      if (state) Y.applyUpdate(this.document, state, "disk");
      this.onError(false);
    } catch {
      this.onError(true);
    }
    if (!this.stopped) this.document.on("update", this.changed);
  }
  flush(): Promise<void> {
    if (this.pending) return this.pending;
    this.pending = (async () => {
      try {
        while (this.saved !== this.generation) {
          const generation = this.generation;
          const snapshot = Y.encodeStateAsUpdate(this.document);
          // Atomic merge also preserves unsent changes from another offline tab.
          await update<Uint8Array>(this.key, (stored) =>
            stored ? Y.mergeUpdates([stored, snapshot]) : snapshot,
          );
          this.saved = generation;
        }
        this.onError(false);
      } catch {
        this.onError(true);
      } finally {
        this.pending = null;
      }
    })();
    return this.pending;
  }
  async destroy() {
    this.stopped = true;
    this.document.off("update", this.changed);
    await this.flush();
  }
}
