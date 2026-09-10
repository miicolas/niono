import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const organization = pgTable("organization", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  logo: text(),
  metadata: text(),
  icon: text().default("D").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
