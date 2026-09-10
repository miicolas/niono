import { pgTable, uuid, text, unique } from "drizzle-orm/pg-core";
import { pmRuns } from "./pm-runs";
import { dates } from "./dates";
export const pmReviews = pgTable(
  "pm_reviews",
  {
    id: uuid().defaultRandom().primaryKey(),
    runId: uuid("run_id")
      .notNull()
      .references(() => pmRuns.id, { onDelete: "cascade" }),
    key: text().notNull(),
    persona: text().notNull(),
    threadId: text("thread_id"),
    status: text()
      .$type<"running" | "completed" | "failed">()
      .notNull()
      .default("running"),
    text: text().notNull().default(""),
    error: text(),
    ...dates(),
  },
  (t) => [unique().on(t.runId, t.key)],
);
