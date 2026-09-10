import type { ToolRequestUserInputParams } from "../../codex/protocol/v2/ToolRequestUserInputParams";
import type { ToolRequestUserInputResponse } from "../../codex/protocol/v2/ToolRequestUserInputResponse";
import { askQuestions } from "./ask-questions";
export async function nativeQuestions(
  userId: string,
  conversationId: string,
  runId: string,
  params: ToolRequestUserInputParams,
): Promise<ToolRequestUserInputResponse> {
  const result = await askQuestions(
    userId,
    conversationId,
    runId,
    "native:" + params.itemId,
    {
      title: "Précisions pour continuer",
      questions: params.questions.map((question) => ({
        id: question.id,
        prompt: question.question,
        kind: (question.options?.length ?? 0) >= 2 ? "single" : "text",
        required: params.isBlocking,
        options:
          (question.options?.length ?? 0) >= 2
            ? question.options!.map((option) => option.label)
            : [],
        allowOther: true,
      })),
    },
  );
  return {
    answers: Object.fromEntries(
      result.answers.map((answer) => [
        answer.id,
        {
          answers: [
            ...(answer.selected ?? []),
            ...(answer.text ? [answer.text] : []),
            ...(answer.skipped ? ["Question passée par l’utilisateur"] : []),
          ],
        },
      ]),
    ),
  };
}
