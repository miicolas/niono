import { jsonb, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { user } from "../auth/schema";
import { dates } from "../columns";
import { workspaces } from "../workspaces/schema";

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
