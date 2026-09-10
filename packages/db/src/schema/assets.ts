import { pgTable, text, uuid, integer } from "drizzle-orm/pg-core";
import { pages } from "./pages";
import { dates } from "./dates";

export const assets = pgTable("assets", {
  id: uuid().defaultRandom().primaryKey(),
  pageId: uuid("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  name: text().notNull(),
  mime: text().notNull(),
  size: integer().notNull(),
  key: text().notNull(),
  ...dates(),
});
