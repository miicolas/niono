import type { CodexRunState } from "@digipm/contracts/codex";
import { pgTable, text, uuid, index, unique } from "drizzle-orm/pg-core";
import { codexConversations } from "./codex-conversations";
import { dates } from "./dates";

export const codexMessages = pgTable(
  "codex_messages",
  {
    id: uuid().defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => codexConversations.id, { onDelete: "cascade" }),
    requestId: uuid("request_id").notNull(),
    role: text().$type<"user" | "assistant">().notNull(),
    text: text().default("").notNull(),
    status: text().$type<CodexRunState>().default("idle").notNull(),
    error: text(),
    ...dates(),
  },
  (t) => [
    unique().on(t.conversationId, t.requestId, t.role),
    index().on(t.conversationId, t.createdAt),
  ],
);
