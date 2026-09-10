import { pgTable, uuid, text, integer, unique } from "drizzle-orm/pg-core";
import { pmRuns } from "./pm-runs";
import { pages } from "./pages";
import { assets } from "./assets";
import { dates } from "./dates";
export const pmArtifacts = pgTable(
  "pm_artifacts",
  {
    id: uuid().defaultRandom().primaryKey(),
    runId: uuid("run_id")
      .notNull()
      .references(() => pmRuns.id, { onDelete: "cascade" }),
    key: text().notNull(),
    hash: text().notNull(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id),
    format: text().notNull(),
    documentRevision: integer("document_revision").notNull(),
    ...dates(),
  },
  (t) => [unique().on(t.runId, t.key)],
);
