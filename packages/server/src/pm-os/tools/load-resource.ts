import { db, schema as s } from "@digipm/db";
import { eq } from "drizzle-orm";
import { withRun } from "../runs/with-run";
import { readPack } from "../pack/read-pack";
import { recordStep } from "../runs/record-step";
export async function loadResource(
  userId: string,
  conversationId: string,
  runId: string,
  path: string,
  workflowId?: string,
) {
  const run = await withRun(
    userId,
    conversationId,
    runId,
    async (_tx, run) => run,
  );
  const pack = await readPack(run.packVersion);
  if (!pack || !Object.hasOwn(pack.resources, path))
    throw new Error(
      "Cette ressource n’existe pas dans le pack de cette exécution.",
    );
  if (workflowId) {
    await db
      .update(s.pmRuns)
      .set({ workflowId, updatedAt: new Date() })
      .where(eq(s.pmRuns.id, runId));
    await recordStep(userId, conversationId, runId, {
      key: "workflow:" + workflowId,
      kind: "workflow",
      label: "/" + workflowId,
      status: "completed",
    });
  }
  return {
    packVersion: pack.version,
    sourceRevision: pack.sourceRevision,
    path,
    content: pack.resources[path],
    resources: Object.keys(pack.resources),
    adaptation:
      "Appliquer le contrat hôte DigiPM : context-library → get_pm_context/read_page, outputs → create_artifact, AskUserQuestion → ask_questions, Task/personas → review_document, shell/code → run_code. Les actions externes utilisent leurs exports.",
  };
}
