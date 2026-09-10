import { pgTable, text, uuid, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { user } from "./user";
import { dates } from "./dates";

export const importJobs = pgTable(
  "import_jobs",
  {
    id: uuid().notNull(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    hash: text().notNull(),
    result: jsonb()
      .$type<{ pageIds: string[]; warnings: string[] }>()
      .notNull(),
    ...dates(),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.userId, t.id] })],
);
