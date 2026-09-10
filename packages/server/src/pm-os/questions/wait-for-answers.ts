import { db, schema as s } from "@digipm/db";
import { eq } from "drizzle-orm";
import type { PmAnswers } from "@digipm/contracts/pm-os";
import { activePmRuns, questionWaiters } from "../runs/live";
export async function waitForAnswers(
  runId: string,
  questionnaireId: string,
): Promise<PmAnswers> {
  const control = activePmRuns.get(runId);
  if (!control)
    throw new Error(
      "Le runtime n’est plus actif. Le questionnaire est conservé.",
    );
  control.signal.throwIfAborted();
  await control.pause();
  try {
    return await new Promise<PmAnswers>((resolve, reject) => {
      const abort = () => {
        questionWaiters.delete(questionnaireId);
        reject(new Error("Demande interrompue."));
      };
      const complete = (answers: PmAnswers) => {
        control.signal.removeEventListener("abort", abort);
        questionWaiters.delete(questionnaireId);
        resolve(answers);
      };
      questionWaiters.set(questionnaireId, {
        runId,
        resolve: complete,
        reject,
      });
      control.signal.addEventListener("abort", abort, { once: true });
      if (control.signal.aborted) {
        abort();
        return;
      }
      void db
        .select()
        .from(s.pmQuestionnaires)
        .where(eq(s.pmQuestionnaires.id, questionnaireId))
        .then(([row]) => {
          if (row?.status === "answered") complete(row.answers);
          else if (!row || row.status === "cancelled") abort();
        })
        .catch(reject);
    });
  } finally {
    questionWaiters.delete(questionnaireId);
    if (!control.signal.aborted) await control.continue();
  }
}
