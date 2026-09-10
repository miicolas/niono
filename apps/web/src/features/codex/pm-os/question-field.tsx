import type { PageQuestion } from "@digipm/contracts/questionnaire";
import {
  QuestionnaireItem,
  QuestionnaireTitle,
  QuestionnaireDescription,
  QuestionnaireChoices,
  QuestionnaireChoice,
  QuestionnaireInput,
  QuestionnaireError,
} from "@/components/ui/questionnaire";
export function PmQuestionField({
  question,
  patch,
}: {
  question: PageQuestion;
  patch: (
    id: string,
    answer: Pick<PageQuestion, "selected" | "text" | "skipped">,
  ) => void;
}) {
  return (
    <QuestionnaireItem
      name={question.id}
      required={question.required}
      multiple={question.kind === "multiple"}
    >
      <QuestionnaireTitle>{question.prompt}</QuestionnaireTitle>
      <QuestionnaireDescription>
        {question.kind === "multiple"
          ? "Plusieurs choix possibles."
          : question.kind === "single"
            ? "Choisissez une réponse."
            : "Votre réponse peut être courte."}
        {!question.required && " Cette réponse est facultative."}
      </QuestionnaireDescription>
      <QuestionnaireChoices>
        {question.kind !== "text" &&
          question.options.map((option) => (
            <QuestionnaireChoice
              key={option}
              value={option}
              checked={question.selected.includes(option)}
              onChange={(event) =>
                patch(question.id, {
                  selected:
                    question.kind === "multiple"
                      ? event.target.checked
                        ? [...question.selected, option]
                        : question.selected.filter((value) => value !== option)
                      : [option],
                  text: question.kind === "single" ? "" : question.text,
                  skipped: false,
                })
              }
            >
              {option}
            </QuestionnaireChoice>
          ))}
        {(question.kind === "text" || question.allowOther) && (
          <QuestionnaireInput
            aria-label={
              question.kind === "text"
                ? question.prompt
                : "Autre réponse : " + question.prompt
            }
            placeholder={
              question.kind === "text" ? "Votre réponse…" : "Autre réponse…"
            }
            value={question.text}
            maxLength={4000}
            onChange={(event) =>
              patch(question.id, {
                selected: question.kind === "multiple" ? question.selected : [],
                text: event.target.value,
                skipped: false,
              })
            }
          />
        )}
      </QuestionnaireChoices>
      <QuestionnaireError>
        Renseignez une réponse pour continuer.
      </QuestionnaireError>
    </QuestionnaireItem>
  );
}
