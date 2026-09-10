import { db, schema as s } from "@digipm/db";
import { and, eq, inArray } from "drizzle-orm";
import { missing } from "../../access";
import { runs } from "./shared";

export async function interruptOwnedConversation(userId: string, id: string) {
  // Ownership suffices to stop a run after a source permission was revoked.
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
  await runs.get(id)?.stop();
  if (row.pmPackVersion)
    await db.transaction(async (tx) => {
      const changed = await tx
        .update(s.pmRuns)
        .set({ status: "interrupted", updatedAt: new Date() })
        .where(
          and(
            eq(s.pmRuns.conversationId, id),
            inArray(s.pmRuns.status, ["running", "awaiting_input"]),
          ),
        )
        .returning({ id: s.pmRuns.id });
      if (changed.length) {
        await tx
          .update(s.pmQuestionnaires)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(
            and(
              inArray(
                s.pmQuestionnaires.runId,
                changed.map((run) => run.id),
              ),
              eq(s.pmQuestionnaires.status, "pending"),
            ),
          );
        await tx
          .update(s.codexConversations)
          .set({ status: "interrupted", updatedAt: new Date() })
          .where(eq(s.codexConversations.id, id));
        await tx
          .update(s.codexMessages)
          .set({ status: "interrupted", updatedAt: new Date() })
          .where(
            and(
              eq(s.codexMessages.conversationId, id),
              inArray(s.codexMessages.status, ["running", "awaiting_input"]),
            ),
          );
      }
    });
  return { interrupted: true };
}
