import { pgTable, uuid, text, unique, foreignKey } from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { pages } from "./pages";
import { user } from "./user";
import { dates } from "./dates";
export const pmSubjects = pgTable(
  "pm_subjects",
  {
    id: uuid().defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    draftsPageId: uuid("drafts_page_id")
      .notNull()
      .references(() => pages.id),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    ...dates(),
  },
  (t) => [
    unique().on(t.workspaceId, t.id),
    unique().on(t.pageId),
    foreignKey({
      columns: [t.workspaceId, t.pageId],
      foreignColumns: [pages.workspaceId, pages.id],
    }),
  ],
);
