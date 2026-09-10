import { pgTable, uuid, text, unique, foreignKey } from "drizzle-orm/pg-core";
import { pages } from "./pages";
import { pmSubjects } from "./pm-subjects";
import { dates } from "./dates";
export const pmContextBindings = pgTable(
  "pm_context_bindings",
  {
    id: uuid().defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").notNull(),
    subjectId: uuid("subject_id"),
    scope: text().notNull(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    role: text().notNull(),
    ...dates(),
  },
  (t) => [
    unique().on(t.workspaceId, t.scope, t.pageId),
    foreignKey({
      columns: [t.workspaceId, t.pageId],
      foreignColumns: [pages.workspaceId, pages.id],
    }),
    foreignKey({
      columns: [t.workspaceId, t.subjectId],
      foreignColumns: [pmSubjects.workspaceId, pmSubjects.id],
    }),
  ],
);
