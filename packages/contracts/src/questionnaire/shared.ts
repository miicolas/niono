import { z } from "zod";
import { questionnaireReady } from "./questionnaire-ready";

export const questionSchema = z
  .object({
    id: z.uuid(),
    prompt: z.string().max(500),
    kind: z.enum(["text", "single", "multiple"]),
    required: z.boolean(),
    options: z.array(z.string().max(200)).max(20),
    allowOther: z.boolean(),
    selected: z.array(z.string().max(200)).max(20),
    text: z.string().max(4000),
    skipped: z.boolean(),
  })
  .strict()
  .refine(
    (q) =>
      new Set(q.options).size === q.options.length &&
      new Set(q.selected).size === q.selected.length &&
      q.selected.every((value) => q.options.includes(value)) &&
      (q.kind === "multiple" || q.selected.length <= 1) &&
      (q.kind !== "text" || q.selected.length === 0) &&
      (q.kind === "text" || q.allowOther || !q.text) &&
      (!q.skipped || (!q.required && !q.selected.length && !q.text)),
    "Réponse incompatible avec la question",
  );

export const questionnaireSchema = z
  .object({
    title: z.string().max(200),
    questions: z.array(questionSchema).min(1).max(30),
    completed: z.boolean(),
  })
  .strict()
  .refine(
    (data) =>
      new Set(data.questions.map((q) => q.id)).size === data.questions.length,
  )
  .refine(
    (data) =>
      !data.completed ||
      (questionnaireReady(data) &&
        data.questions.every(
          (q) =>
            !q.required || q.selected.length > 0 || q.text.trim().length > 0,
        )),
    "Une réponse obligatoire manque",
  );

export type PageQuestion = z.infer<typeof questionSchema>;

export type PageQuestionnaire = {
  title: string;
  questions: PageQuestion[];
  completed: boolean;
};

export type QuestionnaireSectionProps = {
  value: PageQuestionnaire;
  editable: boolean;
  onChange: (value: PageQuestionnaire) => void;
};
