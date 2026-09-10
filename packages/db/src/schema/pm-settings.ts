import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { pages } from "./pages";
import { dates } from "./dates";
export const pmSettings = pgTable("pm_settings", {
  workspaceId: uuid("workspace_id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull().default("Digitevent"),
  companyPageId: uuid("company_page_id")
    .notNull()
    .references(() => pages.id),
  draftsPageId: uuid("drafts_page_id")
    .notNull()
    .references(() => pages.id),
  ...dates(),
});
