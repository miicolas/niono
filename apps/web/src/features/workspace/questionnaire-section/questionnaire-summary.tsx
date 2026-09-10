import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller";
import { type QuestionnaireState } from "./shared";

export function QuestionnaireSummary({
  shownMode,
  value,
}: Pick<QuestionnaireState, "shownMode" | "value">) {
  return (
    shownMode === "summary" && (
      <>
        <p className="mb-3 text-sm text-muted-foreground">
          {value.completed
            ? "Questionnaire terminé."
            : "Questionnaire en cours."}{" "}
          Les réponses suivent la sauvegarde de la page.
        </p>
        <MessageScrollerProvider defaultScrollPosition="start">
          <MessageScroller className="h-80 rounded-md border bg-background">
            <MessageScrollerViewport
              aria-label="Récapitulatif des réponses"
              className="p-4"
            >
              <MessageScrollerContent>
                {value.questions.map((q, index) => (
                  <MessageScrollerItem key={q.id} messageId={q.id} scrollAnchor>
                    <div className="mb-1 text-xs text-muted-foreground">
                      Question {index + 1}
                    </div>
                    <div className="font-medium">
                      {q.prompt || "Question sans intitulé"}
                    </div>
                    <div className="mt-2 whitespace-pre-wrap rounded-md bg-muted px-3 py-2 text-sm">
                      {[...q.selected, q.text].filter(Boolean).join("\n") ||
                        (q.skipped ? "Question passée" : "Sans réponse")}
                    </div>
                  </MessageScrollerItem>
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton behavior="instant" />
          </MessageScroller>
        </MessageScrollerProvider>
      </>
    )
  );
}
