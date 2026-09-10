import { useState } from "react";
import {
  newQuestion,
  type PageQuestionnaire,
} from "@digipm/contracts/questionnaire";
import type { PmAnswers } from "@digipm/contracts/pm-os";
import { client } from "@/lib/api";
import { PmQuestionForm } from "./question-form";
export function PmContextForm({
  workspaceId,
  pages,
  mode,
  onDone,
}: {
  workspaceId: string;
  pages: { id: string; title: string }[];
  mode: "company" | "subject";
  onDone: (subjectId?: string) => Promise<void>;
}) {
  const [requestId] = useState(() => crypto.randomUUID());
  const [definition] = useState<PageQuestionnaire>(() => {
    const name = {
      ...newQuestion(),
      prompt:
        mode === "company"
          ? "Quel nom utiliser pour l’entreprise ?"
          : "Quel sujet souhaitez-vous ouvrir ?",
      kind: "text" as const,
      required: true,
      text: mode === "company" ? "Digitevent" : "",
    };
    const source = {
      ...newQuestion(),
      prompt: "Quelle page utiliser comme point de départ ?",
      kind: "single" as const,
      required: true,
      allowOther: false,
      options: [
        "Créer une nouvelle page",
        ...pages
          .slice(0, 18)
          .map((page) => page.title + " · " + page.id.slice(-6)),
      ],
      selected: ["Créer une nouvelle page"],
    };
    return {
      title:
        mode === "company" ? "Préparer votre contexte PM-OS" : "Nouveau sujet",
      questions: [name, source],
      completed: false,
    };
  });
  const [answers, setAnswers] = useState<PmAnswers>(() =>
    Object.fromEntries(
      definition.questions.map((question) => [
        question.id,
        { selected: question.selected, text: question.text, skipped: false },
      ]),
    ),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const name = answers[definition.questions[0]!.id]!.text;
      const selected = answers[definition.questions[1]!.id]!.selected[0];
      const pageId = pages.find(
        (page) => page.title + " · " + page.id.slice(-6) === selected,
      )?.id;
      if (mode === "company") {
        await client.pm.configure({
          workspaceId,
          companyName: name,
          companyPageId: pageId,
        });
        await onDone();
      } else {
        const subject = await client.pm.createSubject({
          workspaceId,
          title: name,
          pageId,
          requestId,
        });
        await onDone(subject.id);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Impossible de préparer le contexte.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PmQuestionForm
        definition={definition}
        answers={answers}
        onAnswers={setAnswers}
        onSubmit={() => {
          void submit();
        }}
        disabled={busy}
        submitLabel={
          mode === "company" ? "Créer le contexte" : "Ouvrir le sujet"
        }
      />
      {error && (
        <p role="alert" className="pm-error">
          {error}
        </p>
      )}
    </>
  );
}
