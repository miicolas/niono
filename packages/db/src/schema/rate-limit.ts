import { pgTable, text, integer, bigint } from "drizzle-orm/pg-core";

export const rateLimit = pgTable("rate_limit", {
  id: text().primaryKey(),
  key: text().unique().notNull(),
  count: integer().notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});
