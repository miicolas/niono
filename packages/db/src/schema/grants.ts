import { pgTable, text, uuid, primaryKey } from "drizzle-orm/pg-core";
import { pages } from "./pages";
import { user } from "./user";

export const grants = pgTable(
  "page_grants",
  {
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text().$type<"editor" | "viewer">().notNull(),
  },
  (t) => [primaryKey({ columns: [t.pageId, t.userId] })],
);
