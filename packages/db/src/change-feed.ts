import pg from "pg";

export type DatabaseChange = {
  table: string;
  workspaceId?: string;
  pageId?: string;
  userId?: string;
};

/** One LISTEN connection per process, independent of the transaction pool. */
export class ChangeFeed {
  private listeners = new Set<(change: DatabaseChange) => void>();
  private client: pg.Client | null = null;
  private connecting: Promise<void> | null = null;
  private retry: ReturnType<typeof setTimeout> | null = null;
  async subscribe(listener: (change: DatabaseChange) => void) {
    this.listeners.add(listener);
    try {
      await this.connect();
    } catch (error) {
      this.listeners.delete(listener);
      if (!this.listeners.size) this.close();
      throw error;
    }
    return () => {
      this.listeners.delete(listener);
      if (!this.listeners.size) this.close();
    };
  }
  private connect(): Promise<void> {
    if (this.connecting) return this.connecting;
    if (this.client) return Promise.resolve();
    this.connecting = (async () => {
      const client = new pg.Client({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 5000,
      });
      const disconnect = () => {
        if (this.client !== client) return;
        this.client = null;
        void client.end().catch(() => {});
        if (this.listeners.size && !this.retry)
          this.retry = setTimeout(() => {
            this.retry = null;
            void this.connect().catch(() => disconnect());
          }, 1000);
      };
      client.on("error", disconnect);
      client.on("end", disconnect);
      client.on("notification", (notification) => {
        if (!notification.payload) return;
        try {
          const change: DatabaseChange = JSON.parse(notification.payload);
          for (const listener of this.listeners) listener(change);
        } catch {
          /* Ignore messages outside the database trigger contract. */
        }
      });
      this.client = client;
      try {
        await client.connect();
        await client.query("LISTEN digipm_changes");
        for (const listener of this.listeners) listener({ table: "reconnect" });
      } catch (error) {
        disconnect();
        throw error;
      }
    })().finally(() => {
      this.connecting = null;
    });
    return this.connecting;
  }
  close() {
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
    const client = this.client;
    this.client = null;
    if (client) void client.end().catch(() => {});
  }
}

export const changeFeed = new ChangeFeed();
