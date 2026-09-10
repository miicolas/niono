import {
  pgTable,
  text,
  boolean,
  timestamp,
  uuid,
  integer,
  doublePrecision,
  index,
  unique,
  foreignKey,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { user } from "./user";
import { dates } from "./dates";

export const pages = pgTable(
  "pages",
  {
    id: uuid().defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
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
  ],
);
