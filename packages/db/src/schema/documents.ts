import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import type { DocumentNode } from "@digipm/contracts";
import { pages } from "./pages";
import { dates } from "./dates";

export const documents = pgTable(
  "page_documents",
  {
    pageId: uuid("page_id")
      .primaryKey()
      .references(() => pages.id, { onDelete: "cascade" }),
    content: jsonb().$type<DocumentNode>().notNull(),
    revision: integer().default(0).notNull(),
    collaborationState: text("collaboration_state"),
    schemaVersion: integer("schema_version").default(1).notNull(),
    plainText: text("plain_text").default("").notNull(),
    ...dates(),
  },
  (t) => [
    index("document_search_idx").using(
      "gin",
      sql`to_tsvector('simple', ${t.plainText})`,
    ),
  ],
);
