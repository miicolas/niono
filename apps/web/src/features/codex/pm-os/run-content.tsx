import { AssistantQuestionnaire } from "./assistant-questionnaire";
import { ArtifactCard } from "./artifact-card";
import type { EventResult } from "../codex-panel/shared";
export function PmRunContent({
  snapshot,
  runId,
  workspaceId,
}: {
  snapshot: EventResult;
  runId: string;
  workspaceId: string;
}) {
  const pm = snapshot.pm;
  if (!pm) return null;
  const run = pm.runs.find((run) => run.id === runId);
  return (
    <div className="pm-run-content">
      {pm.questionnaires
        .filter((question) => question.runId === runId)
        .map((question) => (
          <AssistantQuestionnaire
            key={question.id}
            conversationId={snapshot.conversation.id}
            questionnaire={question}
          />
        ))}
      {pm.artifacts
        .filter((artifact) => artifact.runId === runId)
        .map((artifact) => (
          <ArtifactCard
            key={artifact.id}
            artifact={artifact}
            conversationId={snapshot.conversation.id}
            workspaceId={workspaceId}
          />
        ))}
      {!!run?.steps.length && (
        <details className="pm-run-steps">
          <summary>
            Étapes du travail ·{" "}
            {run.steps.filter((step) => step.status === "completed").length}/
            {run.steps.length}
          </summary>
          <ol>
            {run.steps.map((step) => (
              <li key={step.key}>
                <span>
                  {step.status === "completed"
                    ? "✓"
                    : step.status === "failed"
                      ? "!"
                      : "…"}{" "}
                  {step.label}
                </span>
                {step.detail && <small>{step.detail}</small>}
              </li>
            ))}
          </ol>
        </details>
      )}
      {pm.reviews
        .filter((review) => review.runId === runId)
        .map((review) => (
          <details className="pm-review" key={review.id}>
            <summary>
              {review.persona} ·{" "}
              {review.status === "completed"
                ? "Terminé"
                : review.status === "failed"
                  ? "À reprendre"
                  : "En cours"}
            </summary>
            <p>{review.error || review.text || "Analyse en cours…"}</p>
          </details>
        ))}
      {!!run?.webSources.length && (
        <div className="codex-sources">
          <strong>Sources web consultées</strong>
          {run.webSources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {source.title || source.url}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
