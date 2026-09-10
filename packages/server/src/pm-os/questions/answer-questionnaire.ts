import { schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { answerQuestionnaireSchema } from "@digipm/contracts/pm-os";
import { questionnaireSchema } from "@digipm/contracts/questionnaire";
import { withConversation } from "../../codex/store/with-conversation";
import { missing } from "../../access";
import { questionWaiters, activePmRuns } from "../runs/live";
export async function answerQuestionnaire(userId: string, raw: unknown) {
  const input = answerQuestionnaireSchema.parse(raw);
  const result = await withConversation(
    userId,
    input.conversationId,
    async (tx) => {
      const [entry] = await tx
        .select({ question: s.pmQuestionnaires, run: s.pmRuns })
        .from(s.pmQuestionnaires)
        .innerJoin(s.pmRuns, eq(s.pmRuns.id, s.pmQuestionnaires.runId))
        .where(
          and(
            eq(s.pmQuestionnaires.id, input.questionnaireId),
            eq(s.pmRuns.conversationId, input.conversationId),
            eq(s.pmRuns.userId, userId),
          ),
        )
        .for("update");
      if (!entry) throw missing();
      const { question } = entry;
      if (
        question.status === "answered" &&
        question.submissionId === input.requestId &&
        input.submit
      ) {
        const same =
          Object.keys(input.answers).length ===
            Object.keys(question.answers).length &&
          Object.entries(input.answers).every(
            ([id, value]) =>
              value.text === question.answers[id]?.text &&
              value.skipped === question.answers[id]?.skipped &&
              JSON.stringify(value.selected) ===
                JSON.stringify(question.answers[id]?.selected),
          );
        if (!same)
          throw new ORPCError("CONFLICT", {
            message:
              "Cette soumission a déjà été utilisée avec d’autres réponses.",
          });
        return question;
      }
      if (
        question.status !== "pending" ||
        question.revision !== input.expectedRevision
      )
        throw new ORPCError("CONFLICT", {
          message: "Ces réponses ont changé. Rechargez le questionnaire.",
        });
      if (
        Object.keys(input.answers).some(
          (id) => !question.definition.questions.some((q) => q.id === id),
        )
      )
        throw new ORPCError("BAD_REQUEST", { message: "Question inconnue." });
      questionnaireSchema.parse({
        ...question.definition,
        completed: input.submit,
        questions: question.definition.questions.map((q) => ({
          ...q,
          ...(input.answers[q.id] ?? {
            selected: [],
            text: "",
            skipped: false,
          }),
        })),
      });
      const [updated] = await tx
        .update(s.pmQuestionnaires)
        .set({
          answers: input.answers,
          status: input.submit ? "answered" : "pending",
          submissionId: input.submit ? input.requestId : null,
          revision: question.revision + 1,
          updatedAt: new Date(),
        })
        .where(eq(s.pmQuestionnaires.id, question.id))
        .returning();
      return updated!;
    },
  );
  if (input.submit) questionWaiters.get(result.id)?.resolve(result.answers);
  return {
    questionnaire: result,
    needsResume: input.submit && !activePmRuns.has(result.runId),
  };
}
