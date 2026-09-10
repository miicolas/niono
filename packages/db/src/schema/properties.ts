import {
  pgTable,
  text,
  uuid,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import type { PropertyOption, PropertyType } from "@digipm/contracts";
import { sources } from "./sources";

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
  (t) => [index("properties_source_idx").on(t.sourceId)],
);
