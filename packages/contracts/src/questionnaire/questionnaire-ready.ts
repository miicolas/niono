import { type PageQuestionnaire } from "./shared";

export function questionnaireReady(data: PageQuestionnaire): boolean {
  return (
    !!data.title.trim() &&
    data.questions.every(
      (q) =>
        !!q.prompt.trim() &&
        (q.kind === "text" ||
          (q.options.length >= 2 && q.options.every((o) => !!o.trim()))),
    )
  );
}
