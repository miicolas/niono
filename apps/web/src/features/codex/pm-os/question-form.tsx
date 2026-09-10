import { useState } from "react";
import type { PageQuestionnaire } from "@digipm/contracts/questionnaire";
import type { PmAnswers } from "@digipm/contracts/pm-os";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnairePrevious,
  QuestionnaireSkip,
  QuestionnaireNext,
  QuestionnaireSubmit,
  QuestionnaireProgress,
} from "@/components/ui/questionnaire";
import { Button } from "@/components/ui/button";
import { PmQuestionField } from "./question-field";
export function PmQuestionForm({
  definition,
  answers,
  onAnswers,
  onSubmit,
  disabled = false,
  completed = false,
  submitLabel = "Transmettre à Codex",
}: {
  definition: PageQuestionnaire;
  answers: PmAnswers;
  onAnswers: (answers: PmAnswers) => void;
  onSubmit: () => void;
  disabled?: boolean;
  completed?: boolean;
  submitLabel?: string;
}) {
  const [current, setCurrent] = useState(definition.questions[0]!.id);
  const [reviewing, setReviewing] = useState(false);
  const patch = (id: string, answer: PmAnswers[string]) =>
    onAnswers({ ...answers, [id]: answer });
  const questions = definition.questions.map((question) => ({
    ...question,
    ...answers[question.id],
  }));
  return (
    <section className="pm-questionnaire" aria-label={definition.title}>
      <h3>{definition.title}</h3>
      {reviewing || completed ? (
        <>
          <dl className="pm-answer-summary">
            {questions.map((question) => (
              <div key={question.id}>
                <dt>{question.prompt}</dt>
                <dd>
                  {[...question.selected, question.text]
                    .filter(Boolean)
                    .join(", ") ||
                    (question.skipped ? "Question passée" : "Sans réponse")}
                </dd>
              </div>
            ))}
          </dl>
          {!completed && (
            <div className="pm-actions">
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => setReviewing(false)}
              >
                Modifier
              </Button>
              <Button size="sm" disabled={disabled} onClick={onSubmit}>
                {submitLabel}
              </Button>
            </div>
          )}
          {completed && <p className="pm-caption">Réponses transmises.</p>}
        </>
      ) : (
        <fieldset disabled={disabled} className="contents">
          <Questionnaire
            items={questions.map((question) => ({
              name: question.id,
              required: question.required,
              choices: question.options.map((value) => ({ value })),
            }))}
            item={current}
            onItemChange={setCurrent}
            onSubmit={(event) => {
              event.preventDefault();
              setReviewing(true);
            }}
          >
            <QuestionnaireProgress
              render={(props, state) => (
                <div {...props} className="pm-caption">
                  Question {state.current} sur {state.total}
                </div>
              )}
            />
            {questions.map((question) => (
              <PmQuestionField
                key={question.id}
                question={question}
                patch={patch}
              />
            ))}
            <QuestionnaireActions>
              <QuestionnairePrevious />
              <QuestionnaireSkip
                onClick={() =>
                  patch(current, { selected: [], text: "", skipped: true })
                }
              />
              <QuestionnaireNext />
              <QuestionnaireSubmit>Vérifier les réponses</QuestionnaireSubmit>
            </QuestionnaireActions>
          </Questionnaire>
        </fieldset>
      )}
    </section>
  );
}
