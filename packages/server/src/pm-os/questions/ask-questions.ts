import { createQuestionnaire } from "./create-questionnaire";
import { waitForAnswers } from "./wait-for-answers";
export async function askQuestions(
  userId: string,
  conversationId: string,
  runId: string,
  key: string,
  raw: unknown,
) {
  const question = await createQuestionnaire(
    userId,
    conversationId,
    runId,
    key,
    raw,
  );
  const answers =
    question.status === "answered"
      ? question.answers
      : await waitForAnswers(runId, question.id);
  return {
    questionnaireId: question.id,
    answers: question.definition.questions.map((q) => ({
      id: question.nativeIds[q.id],
      question: q.prompt,
      ...answers[q.id],
    })),
  };
}
