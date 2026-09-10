import { type PageQuestionnaire } from "./shared";
import { newQuestion } from "./new-question";

export function newQuestionnaire(): PageQuestionnaire {
  return {
    title: "Questionnaire",
    questions: [newQuestion()],
    completed: false,
  };
}
