import { db, schema as s } from "@digipm/db";
import { and, eq, desc } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { conversationFor } from "../../codex/store/conversation-for";
import { forUser } from "../../codex/conversations/for-user";
import { runs } from "../../codex/conversations/shared";
import { getRuntime } from "../../codex/runtime/get-runtime";
import { missing } from "../../access";
import { PmSession } from "./pm-session";
export async function resumeRun(
  userId: string,
  conversationId: string,
  runId: string,
) {
  return forUser(userId, async () => {
    await conversationFor(userId, conversationId);
    if ([...runs.values()].some((run) => run.userId === userId))
      throw new ORPCError("CONFLICT", {
        message: "Une demande est déjà en cours.",
      });
    const [run] = await db
      .select()
      .from(s.pmRuns)
      .where(
        and(
          eq(s.pmRuns.id, runId),
          eq(s.pmRuns.conversationId, conversationId),
          eq(s.pmRuns.userId, userId),
        ),
      );
    if (!run) throw missing();
    const [latest] = await db
      .select()
      .from(s.pmRuns)
      .where(eq(s.pmRuns.conversationId, conversationId))
      .orderBy(desc(s.pmRuns.createdAt))
      .limit(1);
    if (latest?.id !== runId || run.status === "completed")
      throw new ORPCError("CONFLICT", {
        message: "Cette demande ne peut plus être reprise.",
      });
    const [pending] = await db
      .select()
      .from(s.pmQuestionnaires)
      .where(
        and(
          eq(s.pmQuestionnaires.runId, runId),
          eq(s.pmQuestionnaires.status, "pending"),
        ),
      );
    if (pending)
      throw new ORPCError("PRECONDITION_FAILED", {
        message: "Répondez d’abord au questionnaire.",
      });
    const runtime = await getRuntime(userId);
    const session = new PmSession(userId, conversationId, runId, runtime, true);
    void session.start();
    return { conversationId };
  });
}
