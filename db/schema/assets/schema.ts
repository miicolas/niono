import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { dates } from "../columns";
import { pages } from "../pages/schema";

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
