import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { DocumentNode } from "@/lib/editor/document-node";
import { user } from "../auth/schema";
import { dates } from "../columns";
import { pages } from "../pages/schema";

export const documents = pgTable(
  "page_documents",
  {
    pageId: uuid("page_id")
      .primaryKey()
      .references(() => pages.id, { onDelete: "cascade" }),
    content: jsonb().$type<DocumentNode>().notNull(),
    revision: integer().default(0).notNull(),
    schemaVersion: integer("schema_version").default(1).notNull(),
    plainText: text("plain_text").default("").notNull(),
    ...dates(),
  },
  (t) => [
    index("document_search_idx").using(
      "gin",
      sql`to_tsvector('simple', ${t.plainText})`
    ),
  ]
);
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
  (t) => [index().on(t.pageId, t.createdAt)]
);
export const receipts = pgTable(
  "mutation_receipts",
  {
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    mutationId: uuid("mutation_id").notNull(),
    actorId: text("actor_id").notNull(),
    hash: text().notNull(),
    revision: integer().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.pageId, t.mutationId, t.actorId] })]
);
