import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";
import { pages } from "./pages";

export const receipts = pgTable(
  "mutation_receipts",
  {
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    mutationId: uuid("mutation_id").notNull(),
    actorId: text("actor_id").notNull(),
    hash: text().notNull(),
    revision: integer().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.pageId, t.mutationId, t.actorId] })],
);
