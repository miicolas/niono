import { pgTable, uuid } from "drizzle-orm/pg-core";
import { pages } from "./pages";
import { organization } from "./organization";

export const sources = pgTable("data_sources", {
  id: uuid().defaultRandom().primaryKey(),
  pageId: uuid("page_id")
    .notNull()
    .unique()
    .references(() => pages.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
});
