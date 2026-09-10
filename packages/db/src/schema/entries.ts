import { pgTable, uuid, doublePrecision, index } from "drizzle-orm/pg-core";
import { sources } from "./sources";
import { pages } from "./pages";

export const entries = pgTable(
  "database_entries",
  {
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    pageId: uuid("page_id")
      .primaryKey()
      .references(() => pages.id, { onDelete: "cascade" }),
    position: doublePrecision().default(0).notNull(),
  },
  (t) => [
    index("entries_source_position_idx").on(t.sourceId, t.position, t.pageId),
  ],
);
