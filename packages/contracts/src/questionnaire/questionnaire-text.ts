import { type PageQuestionnaire } from "./shared";

export function questionnaireText(data: PageQuestionnaire): string {
  return [
    data.title,
    ...data.questions.map(
      (q) =>
        `${q.prompt}\n${[...q.selected, q.text].filter(Boolean).join(", ") || (q.skipped ? "Question passée" : "Sans réponse")}`,
    ),
  ].join("\n");
}
