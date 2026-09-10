import type { CodexAction } from "@digipm/contracts/codex";
import {
  pgTable,
  text,
  uuid,
  jsonb,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { dates } from "./dates";
import { codexConversations } from "./codex-conversations";

export const codexProposals = pgTable(
  "codex_proposals",
  {
    id: uuid().defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id").notNull(),
    userId: text("user_id").notNull(),
    workspaceId: uuid("workspace_id").notNull(),
    requestId: uuid("request_id").notNull(),
    action: jsonb().$type<CodexAction>().notNull(),
    before: text().notNull(),
    summary: text().notNull(),
    status: text()
      .$type<"pending" | "applied" | "rejected">()
      .default("pending")
      .notNull(),
    result: jsonb().$type<{
      pageId: string;
      revision?: number;
      mode?: "replace" | "insert";
    }>(),
    ...dates(),
  },
  (t) => [
    foreignKey({
      columns: [t.conversationId, t.userId, t.workspaceId],
      foreignColumns: [
        codexConversations.id,
        codexConversations.userId,
        codexConversations.workspaceId,
      ],
    }).onDelete("cascade"),
    index().on(t.conversationId),
  ],
);
