import { useState } from "react";
import {
  questionnaireReady,
  type PageQuestion,
  type QuestionnaireSectionProps,
} from "@digipm/contracts/questionnaire";

export function useQuestionnaireSection({
  value,
  editable,
  onChange,
}: QuestionnaireSectionProps) {
  const [mode, setMode] = useState<"configure" | "answer" | "summary">(
    !questionnaireReady(value)
      ? "configure"
      : value.completed
        ? "summary"
        : "answer",
  );
  const [current, setCurrent] = useState(value.questions[0]!.id);
  const active = value.questions.some((q) => q.id === current)
    ? current
    : value.questions[0]!.id;
  const ready = questionnaireReady(value);
  const patch = (id: string, change: Partial<PageQuestion>) => {
    if (editable)
      onChange({
        ...value,
        completed: false,
        questions: value.questions.map((q) =>
          q.id === id ? { ...q, ...change } : q,
        ),
      });
  };
  const configure = (id: string, change: Partial<PageQuestion>) =>
    patch(id, {
      ...change,
      selected: [],
      text: "",
      skipped: false,
    });
  const shownMode = !editable ? "summary" : mode;

  return {
    value,
    editable,
    shownMode,
    setMode,
    ready,
    onChange,
    configure,
    setCurrent,
    active,
    patch,
  };
}
