import { pgTable, text, uuid, integer, jsonb } from "drizzle-orm/pg-core";
import type { ViewConfig } from "@digipm/contracts";
import { sources } from "./sources";

export const views = pgTable("database_views", {
  id: uuid().defaultRandom().primaryKey(),
  sourceId: uuid("source_id")
    .notNull()
    .references(() => sources.id, { onDelete: "cascade" }),
  name: text().notNull(),
  config: jsonb().$type<ViewConfig>().notNull(),
  revision: integer().default(0).notNull(),
});
