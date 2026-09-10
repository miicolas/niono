import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import { type QuestionnaireState } from "./shared";

export function QuestionnaireAnswers({
  shownMode,
  ready,
  value,
  active,
  setCurrent,
  editable,
  onChange,
  setMode,
  patch,
}: Pick<
  QuestionnaireState,
  | "shownMode"
  | "ready"
  | "value"
  | "active"
  | "setCurrent"
  | "editable"
  | "onChange"
  | "setMode"
  | "patch"
>) {
  return (
    shownMode === "answer" &&
    ready && (
      <Questionnaire
        items={value.questions.map((q) => ({
          name: q.id,
          required: q.required,
          choices: q.options.map((option) => ({ value: option })),
        }))}
        item={active}
        onItemChange={setCurrent}
        onSubmit={(event) => {
          event.preventDefault();
          if (editable) {
            onChange({ ...value, completed: true });
            setMode("summary");
          }
        }}
      >
        <QuestionnaireProgress
          render={(props, state) => (
            <div {...props}>
              Question {state.current} sur {state.total}
            </div>
          )}
        />
        {value.questions.map((question) => (
          <QuestionnaireItem
            key={question.id}
            name={question.id}
            required={question.required}
            multiple={question.kind === "multiple"}
          >
            <QuestionnaireTitle>{question.prompt}</QuestionnaireTitle>
            <QuestionnaireDescription>
              {question.kind === "multiple"
                ? "Sélectionnez une ou plusieurs réponses."
                : question.kind === "single"
                  ? "Sélectionnez une réponse."
                  : "Écrivez votre réponse."}
              {!question.required && " Vous pouvez passer cette question."}
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              {question.kind !== "text" &&
                question.options.map((option) => (
                  <QuestionnaireChoice
                    key={option}
                    value={option}
                    checked={question.selected.includes(option)}
                    onChange={(e) =>
                      patch(question.id, {
                        selected:
                          question.kind === "multiple"
                            ? e.target.checked
                              ? [...question.selected, option]
                              : question.selected.filter((o) => o !== option)
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
                      : `Autre réponse : ${question.prompt}`
                  }
                  placeholder={
                    question.kind === "text"
                      ? "Votre réponse…"
                      : "Autre réponse…"
                  }
                  value={question.text}
                  maxLength={4000}
                  onChange={(e) =>
                    patch(question.id, {
                      text: e.target.value,
                      skipped: false,
                      selected:
                        question.kind === "multiple" ? question.selected : [],
                    })
                  }
                />
              )}
            </QuestionnaireChoices>
            <QuestionnaireError>
              Renseignez une réponse pour continuer.
            </QuestionnaireError>
          </QuestionnaireItem>
        ))}
        <QuestionnaireActions>
          <QuestionnairePrevious />
          <QuestionnaireSkip
            onClick={() =>
              patch(active, { selected: [], text: "", skipped: true })
            }
          />
          <QuestionnaireNext />
          <QuestionnaireSubmit />
        </QuestionnaireActions>
      </Questionnaire>
    )
  );
}
