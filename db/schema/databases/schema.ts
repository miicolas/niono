import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  PropertyOption,
  PropertyType,
  ViewConfig,
} from "@/validators/databases";
import { pages } from "../pages/schema";
import { workspaces } from "../workspaces/schema";

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
