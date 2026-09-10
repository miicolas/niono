import {
  pgTable,
  uuid,
  text,
  jsonb,
  index,
  foreignKey,
  integer,
} from "drizzle-orm/pg-core";
import type { PmRun, PmStep, PmWebSource } from "@digipm/contracts/pm-os";
import { codexConversations } from "./codex-conversations";
import { pmSubjects } from "./pm-subjects";
import { dates } from "./dates";
export const pmRuns = pgTable(
  "pm_runs",
  {
    id: uuid().primaryKey(),
    conversationId: uuid("conversation_id").notNull(),
    userId: text("user_id").notNull(),
    workspaceId: uuid("workspace_id").notNull(),
    subjectId: uuid("subject_id"),
    workflowId: text("workflow_id"),
    packVersion: text("pack_version").notNull(),
    status: text().$type<PmRun["status"]>().notNull().default("running"),
    activeMilliseconds: integer("active_milliseconds").notNull().default(0),
    steps: jsonb().$type<PmStep[]>().notNull().default([]),
    webSources: jsonb("web_sources")
      .$type<PmWebSource[]>()
      .notNull()
      .default([]),
    ...dates(),
  },
  (t) => [
    index().on(t.conversationId, t.createdAt),
    foreignKey({
      columns: [t.conversationId, t.userId, t.workspaceId],
      foreignColumns: [
        codexConversations.id,
        codexConversations.userId,
        codexConversations.workspaceId,
      ],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.workspaceId, t.subjectId],
      foreignColumns: [pmSubjects.workspaceId, pmSubjects.id],
    }),
  ],
);
