import { schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { askQuestionsSchema } from "@digipm/contracts/pm-os";
import {
  questionnaireSchema,
  questionnaireReady,
} from "@digipm/contracts/questionnaire";
import { withRun } from "../runs/with-run";
export async function createQuestionnaire(
  userId: string,
  conversationId: string,
  runId: string,
  key: string,
  raw: unknown,
) {
  const input = askQuestionsSchema.parse(raw);
  if (
    new Set(input.questions.map((question) => question.id)).size !==
    input.questions.length
  )
    throw new Error("Identifiants de questions dupliqués.");
  const nativeIds: Record<string, string> = {};
  const definition = questionnaireSchema.parse({
    title: input.title,
    completed: false,
    questions: input.questions.map((question) => {
      const id = crypto.randomUUID();
      nativeIds[id] = question.id;
      return { ...question, id, selected: [], text: "", skipped: false };
    }),
  });
  if (!questionnaireReady(definition))
    throw new Error("Questionnaire incomplet : renseignez les choix proposés.");
  return withRun(userId, conversationId, runId, async (tx) => {
    const [existing] = await tx
      .select()
      .from(s.pmQuestionnaires)
      .where(
        and(
          eq(s.pmQuestionnaires.runId, runId),
          eq(s.pmQuestionnaires.key, key),
        ),
      );
    if (existing) return existing;
    const [pending] = await tx
      .select()
      .from(s.pmQuestionnaires)
      .where(
        and(
          eq(s.pmQuestionnaires.runId, runId),
          eq(s.pmQuestionnaires.status, "pending"),
        ),
      );
    if (pending) throw new Error("Un questionnaire attend déjà une réponse.");
    const [questionnaire] = await tx
      .insert(s.pmQuestionnaires)
      .values({ runId, key, definition, nativeIds })
      .returning();
    return questionnaire!;
  });
}
