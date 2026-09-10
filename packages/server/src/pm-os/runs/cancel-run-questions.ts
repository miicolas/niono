import { db, schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";

export async function cancelRunQuestions(runId: string) {
  await db
    .update(s.pmQuestionnaires)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(
      and(
        eq(s.pmQuestionnaires.runId, runId),
        eq(s.pmQuestionnaires.status, "pending"),
      ),
    );
}
