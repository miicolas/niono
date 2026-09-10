import { db, schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { workspaceRole, missing } from "../../access";
import { getRuntime } from "../runtime";
import { runs } from "./shared";

export async function removeOwnedConversation(userId: string, id: string) {
  // Deletion remains possible even if a source has been revoked.
  const [row] = await db
    .select()
    .from(s.codexConversations)
    .where(
      and(
        eq(s.codexConversations.id, id),
        eq(s.codexConversations.userId, userId),
      ),
    );
  if (!row) throw missing();
  await workspaceRole(db, userId, row.workspaceId);
  await runs.get(id)?.stop();
  // A stopped startup may have created its native thread while we were waiting.
  const [current] = await db
    .select()
    .from(s.codexConversations)
    .where(eq(s.codexConversations.id, id));
  const reviews = await db
    .select({ threadId: s.pmReviews.threadId })
    .from(s.pmReviews)
    .innerJoin(s.pmRuns, eq(s.pmRuns.id, s.pmReviews.runId))
    .where(eq(s.pmRuns.conversationId, id));
  for (const review of reviews)
    if (review.threadId) {
      const runtime = await getRuntime(userId);
      await runtime.request("thread/delete", { threadId: review.threadId });
    }
  if (current?.threadId) {
    const runtime = await getRuntime(userId);
    await runtime.request("thread/delete", { threadId: current.threadId });
  }
  await db.delete(s.codexConversations).where(eq(s.codexConversations.id, id));
  return { deleted: true };
}
