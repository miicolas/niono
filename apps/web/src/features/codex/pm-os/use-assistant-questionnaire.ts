import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  AssistantQuestionnaire,
  PmAnswers,
} from "@digipm/contracts/pm-os";
import { client } from "@/lib/api";
export function useAssistantQuestionnaire(
  conversationId: string,
  questionnaire: AssistantQuestionnaire,
) {
  const cache = useQueryClient();
  const [answers, setAnswers] = useState(questionnaire.answers);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answered, setAnswered] = useState(questionnaire.status === "answered");
  const latest = useRef(answers);
  const revision = useRef(questionnaire.revision);
  const acknowledged = useRef(JSON.stringify(questionnaire.answers));
  const queue = useRef(Promise.resolve());
  const submission = useRef<string | null>(null);
  useEffect(() => {
    if (
      !saving &&
      JSON.stringify(latest.current) === acknowledged.current &&
      questionnaire.revision > revision.current
    ) {
      revision.current = questionnaire.revision;
      latest.current = questionnaire.answers;
      acknowledged.current = JSON.stringify(questionnaire.answers);
      setAnswers(questionnaire.answers);
    }
    if (questionnaire.status === "answered") setAnswered(true);
  }, [questionnaire, saving]);
  const persist = (submit: boolean) => {
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        if (!submit && JSON.stringify(latest.current) === acknowledged.current)
          return;
        setSaving(true);
        setError(null);
        if (submit) submission.current ??= crypto.randomUUID();
        const value = latest.current;
        try {
          const result = await client.pm.answer({
            conversationId,
            questionnaireId: questionnaire.id,
            expectedRevision: revision.current,
            requestId: submit ? submission.current! : crypto.randomUUID(),
            submit,
            answers: value,
          });
          revision.current = result.questionnaire.revision;
          acknowledged.current = JSON.stringify(result.questionnaire.answers);
          if (submit) setAnswered(true);
          await cache.invalidateQueries({ queryKey: ["codex-events"] });
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Les réponses n’ont pas été enregistrées.",
          );
          throw error;
        } finally {
          setSaving(false);
        }
      });
    return queue.current;
  };
  const change = (value: PmAnswers) => {
    if (submitting || answered) return;
    latest.current = value;
    setAnswers(value);
    void persist(false).catch(() => {});
  };
  const submit = () => {
    if (submitting || answered) return;
    setSubmitting(true);
    void persist(true)
      .catch(() => {})
      .finally(() => setSubmitting(false));
  };
  return {
    answers,
    change,
    submit,
    saving,
    submitting,
    error,
    answered,
    retry: () => {
      void persist(false).catch(() => {});
    },
  };
}
