import type { AssistantQuestionnaire as Questionnaire } from "@digipm/contracts/pm-os";
import { Button } from "@/components/ui/button";
import { PmQuestionForm } from "./question-form";
import { useAssistantQuestionnaire } from "./use-assistant-questionnaire";
export function AssistantQuestionnaire({
  conversationId,
  questionnaire,
}: {
  conversationId: string;
  questionnaire: Questionnaire;
}) {
  const state = useAssistantQuestionnaire(conversationId, questionnaire);
  if (questionnaire.status === "cancelled")
    return (
      <p className="pm-caption">
        Questionnaire « {questionnaire.definition.title} » interrompu. Les
        réponses partielles sont conservées.
      </p>
    );
  return (
    <div>
      <PmQuestionForm
        definition={questionnaire.definition}
        answers={state.answers}
        onAnswers={state.change}
        onSubmit={state.submit}
        disabled={state.submitting}
        completed={state.answered}
      />
      {!state.answered && (
        <p className="pm-caption" role="status">
          {state.saving
            ? "Enregistrement des réponses…"
            : "Réponses sauvegardées. Codex les recevra après validation."}
        </p>
      )}
      {state.error && (
        <div role="alert" className="pm-error">
          {state.error}
          <Button variant="ghost" size="sm" onClick={state.retry}>
            Réessayer
          </Button>
        </div>
      )}
    </div>
  );
}
