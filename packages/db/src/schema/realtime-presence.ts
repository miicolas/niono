import {
  pgTable,
  uuid,
  text,
  bigint,
  jsonb,
  timestamp,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { pages } from "./pages";
import { session } from "./session";
import type { Presence } from "@digipm/contracts/realtime";

export const realtimePresence = pgTable(
  "realtime_presence",
  {
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    clientId: bigint("client_id", { mode: "number" }).notNull(),
    sessionId: text("session_id")
      .notNull()
      .references(() => session.id, { onDelete: "cascade" }),
    clock: bigint("clock", { mode: "number" }).notNull(),
    state: jsonb("state").$type<Presence["state"]>(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.pageId, t.clientId] }),
    index().on(t.expiresAt),
  ],
);
