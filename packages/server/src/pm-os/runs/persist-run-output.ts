import { db, schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { conversationFor } from "../../codex/store/conversation-for";

export async function persistRunOutput(
  userId: string,
  conversationId: string,
  runId: string,
  text: string,
) {
  await conversationFor(userId, conversationId);
  await db
    .update(s.codexMessages)
    .set({ text, updatedAt: new Date() })
    .where(
      and(
        eq(s.codexMessages.conversationId, conversationId),
        eq(s.codexMessages.requestId, runId),
        eq(s.codexMessages.role, "assistant"),
      ),
    );
}
