import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import type { DocumentNode } from "@digipm/contracts";
import { pages } from "./pages";
import { user } from "./user";

export const versions = pgTable(
  "document_versions",
  {
    id: uuid().defaultRandom().primaryKey(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    content: jsonb().$type<DocumentNode>().notNull(),
    revision: integer().notNull(),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index().on(t.pageId, t.createdAt)],
);
