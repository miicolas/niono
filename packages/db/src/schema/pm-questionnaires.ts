import {
  pgTable,
  uuid,
  text,
  jsonb,
  integer,
  unique,
} from "drizzle-orm/pg-core";
import type {
  AssistantQuestionnaire,
  PmAnswers,
} from "@digipm/contracts/pm-os";
import type { PageQuestionnaire } from "@digipm/contracts/questionnaire";
import { pmRuns } from "./pm-runs";
import { dates } from "./dates";
export const pmQuestionnaires = pgTable(
  "pm_questionnaires",
  {
    id: uuid().defaultRandom().primaryKey(),
    runId: uuid("run_id")
      .notNull()
      .references(() => pmRuns.id, { onDelete: "cascade" }),
    key: text().notNull(),
    definition: jsonb().$type<PageQuestionnaire>().notNull(),
    answers: jsonb().$type<PmAnswers>().notNull().default({}),
    nativeIds: jsonb("native_ids")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    status: text()
      .$type<AssistantQuestionnaire["status"]>()
      .notNull()
      .default("pending"),
    revision: integer().notNull().default(0),
    submissionId: uuid("submission_id"),
    ...dates(),
  },
  (t) => [unique().on(t.runId, t.key)],
);
