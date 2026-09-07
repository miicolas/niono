import {
  type AnyPgColumn,
  boolean,
  doublePrecision,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "../auth/schema";
import { dates } from "../columns";
import { workspaces } from "../workspaces/schema";

export const pages = pgTable(
  "pages",
  {
    id: uuid().defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => pages.id),
    title: text().default("Sans titre").notNull(),
    icon: text().default("📄").notNull(),
    cover: text(),
    coverPosition: integer("cover_position").default(50).notNull(),
    kind: text().$type<"page" | "database">().default("page").notNull(),
    position: doublePrecision().default(0).notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    privateRoot: boolean("private_root").default(false).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    revision: integer().default(0).notNull(),
    ...dates(),
  },
  (t) => [
    unique().on(t.workspaceId, t.id),
    foreignKey({
      columns: [t.workspaceId, t.parentId],
      foreignColumns: [t.workspaceId, t.id],
    }),
    index("pages_parent_idx").on(t.parentId),
    index("page_tree_idx").on(t.workspaceId, t.parentId, t.position),
  ]
);
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
  (t) => [primaryKey({ columns: [t.pageId, t.userId] })]
);
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
  (t) => [primaryKey({ columns: [t.userId, t.pageId] })]
);
export const recentPages = pgTable(
  "recent_pages",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    visitedAt: timestamp("visited_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.pageId] })]
);
