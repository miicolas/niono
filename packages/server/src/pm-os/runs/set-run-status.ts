import { db, schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import type { PmRun } from "@digipm/contracts/pm-os";
export async function setRunStatus(
  runId: string,
  conversationId: string,
  status: PmRun["status"],
  error: string | null = null,
) {
  await db.transaction(async (tx) => {
    await tx
      .update(s.pmRuns)
      .set({ status, updatedAt: new Date() })
      .where(eq(s.pmRuns.id, runId));
    await tx
      .update(s.codexConversations)
      .set({ status, updatedAt: new Date() })
      .where(eq(s.codexConversations.id, conversationId));
    await tx
      .update(s.codexMessages)
      .set({ status, error, updatedAt: new Date() })
      .where(
        and(
          eq(s.codexMessages.conversationId, conversationId),
          eq(s.codexMessages.requestId, runId),
          eq(s.codexMessages.role, "assistant"),
        ),
      );
  });
}
