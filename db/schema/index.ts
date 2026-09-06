import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigint,
  boolean,
  check,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  DocumentNode,
  PropertyOption,
  PropertyType,
  ViewConfig,
} from "@/validators/contracts";

const dates = () => ({
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text(),
  ...dates(),
});
export const session = pgTable("session", {
  id: text().primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text().notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ...dates(),
});
export const account = pgTable("account", {
  id: text().primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text(),
  password: text(),
  ...dates(),
});
export const verification = pgTable("verification", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  ...dates(),
});
export const rateLimit = pgTable("rate_limit", {
  id: text().primaryKey(),
  key: text().unique().notNull(),
  count: integer().notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});
export const workspaces = pgTable("workspaces", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  icon: text().default("D").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id),
  ...dates(),
});
export const members = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text().$type<"owner" | "editor" | "viewer">().notNull(),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.userId] })]
);
export const invitations = pgTable("invitations", {
  id: uuid().defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  email: text().notNull(),
  role: text().$type<"editor" | "viewer">().notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  ...dates(),
});
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
export const sources = pgTable("data_sources", {
  id: uuid().defaultRandom().primaryKey(),
  pageId: uuid("page_id")
    .notNull()
    .unique()
    .references(() => pages.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
});
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
  ]
);
export const properties = pgTable(
  "property_definitions",
  {
    id: uuid().defaultRandom().primaryKey(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    name: text().notNull(),
    type: text().$type<PropertyType>().notNull(),
    options: jsonb().$type<PropertyOption[]>().default([]).notNull(),
    position: integer().default(0).notNull(),
  },
  (t) => [index("properties_source_idx").on(t.sourceId)]
);
export const values = pgTable(
  "property_values",
  {
    pageId: uuid("page_id")
      .notNull()
      .references(() => entries.pageId, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    textValue: text("text_value"),
    numberValue: doublePrecision("number_value"),
    boolValue: boolean("bool_value"),
    arrayValue: jsonb("array_value").$type<string[]>(),
    revision: integer().default(0).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.pageId, t.propertyId] }),
    index().on(t.propertyId, t.textValue),
    index().on(t.propertyId, t.numberValue),
    check(
      "property_value_single_type",
      sql`num_nonnulls(${t.textValue},${t.numberValue},${t.boolValue},${t.arrayValue}) <= 1`
    ),
    check(
      "property_value_array",
      sql`${t.arrayValue} IS NULL OR jsonb_typeof(${t.arrayValue}) = 'array'`
    ),
  ]
);
export const views = pgTable("database_views", {
  id: uuid().defaultRandom().primaryKey(),
  sourceId: uuid("source_id")
    .notNull()
    .references(() => sources.id, { onDelete: "cascade" }),
  name: text().notNull(),
  config: jsonb().$type<ViewConfig>().notNull(),
  revision: integer().default(0).notNull(),
});
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

export const importJobs = pgTable(
  "import_jobs",
  {
    id: uuid().notNull(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    hash: text().notNull(),
    result: jsonb()
      .$type<{ pageIds: string[]; warnings: string[] }>()
      .notNull(),
    ...dates(),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.userId, t.id] })]
);
