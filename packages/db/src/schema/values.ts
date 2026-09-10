import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  boolean,
  uuid,
  integer,
  doublePrecision,
  jsonb,
  primaryKey,
  index,
  check,
} from "drizzle-orm/pg-core";
import { entries } from "./entries";
import { properties } from "./properties";

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
      sql`num_nonnulls(${t.textValue},${t.numberValue},${t.boolValue},${t.arrayValue}) <= 1`,
    ),
    check(
      "property_value_array",
      sql`${t.arrayValue} IS NULL OR jsonb_typeof(${t.arrayValue}) = 'array'`,
    ),
  ],
);
