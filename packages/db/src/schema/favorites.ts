import {
  pgTable,
  text,
  uuid,
  doublePrecision,
  primaryKey,
} from "drizzle-orm/pg-core";
import { user } from "./user";
import { pages } from "./pages";

export const favorites = pgTable(
  "favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    position: doublePrecision().default(0).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.pageId] })],
);
