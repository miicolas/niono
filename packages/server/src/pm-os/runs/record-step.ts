import { schema as s } from "@digipm/db";
import { eq } from "drizzle-orm";
import type { PmStep } from "@digipm/contracts/pm-os";
import { withRun } from "./with-run";
export async function recordStep(
  userId: string,
  conversationId: string,
  runId: string,
  step: PmStep,
) {
  return withRun(
    userId,
    conversationId,
    runId,
    async (tx, run) => {
      const steps = run.steps.filter((item) => item.key !== step.key);
      steps.push(step);
      await tx
        .update(s.pmRuns)
        .set({ steps: steps.slice(-100), updatedAt: new Date() })
        .where(eq(s.pmRuns.id, runId));
    },
    false,
  );
}
