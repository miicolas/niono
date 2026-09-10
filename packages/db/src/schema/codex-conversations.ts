import type {
  CodexSource,
  CodexRunState,
  CodexSelection,
} from "@digipm/contracts/codex";
import { pgTable, text, uuid, jsonb, index, unique } from "drizzle-orm/pg-core";
import { user } from "./user";
import { organization } from "./organization";
import { dates } from "./dates";

export const codexConversations = pgTable(
  "codex_conversations",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    threadId: text("thread_id"),
    pmPackVersion: text("pm_pack_version"),
    pmSubjectId: uuid("pm_subject_id"),
    continuedFrom: uuid("continued_from"),
    pmHistory: jsonb("pm_history")
      .$type<{ role: string; text: string }[]>()
      .notNull()
      .default([]),
    title: text().notNull(),
    status: text().$type<CodexRunState>().default("idle").notNull(),
    sources: jsonb().$type<CodexSource[]>().default([]).notNull(),
    context: jsonb()
      .$type<{ pageId?: string; selection?: CodexSelection }>()
      .default({})
      .notNull(),
    ...dates(),
  },
  (t) => [
    unique().on(t.id, t.userId, t.workspaceId),
    index().on(t.userId, t.workspaceId, t.updatedAt),
  ],
);
