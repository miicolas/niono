import { createHash } from "node:crypto";
import { reviewSchema } from "@digipm/contracts/pm-os";
import { readPmPage } from "../tools/read-page";
import { getPmContext } from "../tools/get-context";
import { withRun } from "../runs/with-run";
import { readPack } from "../pack/read-pack";
import { recordStep } from "../runs/record-step";
import { runReviewer } from "./run-reviewer";
const panels = new Set<string>();
export async function reviewDocument(
  userId: string,
  conversationId: string,
  runId: string,
  raw: unknown,
  signal: AbortSignal,
) {
  const input = reviewSchema.parse(raw);
  if (panels.has(runId))
    throw new Error("Une revue est déjà en cours pour cette demande.");
  panels.add(runId);
  try {
    const run = await withRun(
      userId,
      conversationId,
      runId,
      async (_tx, run) => run,
    );
    const pack = await readPack(run.packVersion);
    if (!pack) throw new Error("Pack indisponible.");
    const target = await readPmPage(
      userId,
      conversationId,
      runId,
      input.pageId,
      0,
    );
    const context = await getPmContext(userId, conversationId, runId);
    const key = createHash("sha256")
      .update(
        JSON.stringify({
          pageId: input.pageId,
          revision: target.documentRevision,
          references: context.references,
          pack: run.packVersion,
        }),
      )
      .digest("hex");
    const queue = [...new Set(input.perspectives)];
    await recordStep(userId, conversationId, runId, {
      key: "review:" + key,
      kind: "review",
      label: "Relecture de « " + target.title + " »",
      status: "running",
    });
    const results = [] as Awaited<ReturnType<typeof runReviewer>>[];
    await Promise.all(
      Array.from({ length: Math.min(3, queue.length) }, async () => {
        while (queue.length) {
          signal.throwIfAborted();
          const persona = queue.shift()!;
          results.push(
            await runReviewer({
              userId,
              conversationId,
              runId,
              key: key + ":" + persona,
              persona,
              pack,
              target,
              context,
              signal,
            }),
          );
        }
      }),
    );
    signal.throwIfAborted();
    await recordStep(userId, conversationId, runId, {
      key: "review:" + key,
      kind: "review",
      label: "Relecture de « " + target.title + " »",
      status: results.every((result) => result.status === "completed")
        ? "completed"
        : "failed",
    });
    return {
      pageId: target.pageId,
      documentRevision: target.documentRevision,
      reviews: results,
      synthesis:
        "Comparer les accords et désaccords, citer les objections par perspective, proposer les corrections sans les appliquer. Regrouper les questions bloquantes dans ask_questions. Les avis sont des simulations de perspectives.",
    };
  } finally {
    panels.delete(runId);
  }
}
