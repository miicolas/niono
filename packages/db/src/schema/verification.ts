import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { dates } from "./dates";

export const verification = pgTable("verification", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  ...dates(),
});
