import { schema as s, type Transaction } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { withConversation } from "../../codex/store/with-conversation";
import { missing } from "../../access";
export async function withRun<T>(
  userId: string,
  conversationId: string,
  runId: string,
  work: (
    tx: Transaction,
    run: typeof s.pmRuns.$inferSelect,
    conversation: typeof s.codexConversations.$inferSelect,
  ) => Promise<T>,
  requireActive = true,
) {
  return withConversation(userId, conversationId, async (tx, conversation) => {
    const [run] = await tx
      .select()
      .from(s.pmRuns)
      .where(
        and(
          eq(s.pmRuns.id, runId),
          eq(s.pmRuns.conversationId, conversationId),
          eq(s.pmRuns.userId, userId),
        ),
      )
      .for("update");
    if (!run) throw missing();
    if (
      requireActive &&
      (run.status !== "running" || conversation.status !== "running")
    )
      throw new ORPCError("CONFLICT", {
        message: "Cette exécution n’est plus active.",
      });
    return work(tx, run, conversation);
  });
}
