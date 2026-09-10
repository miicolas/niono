import { createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { codeTaskSchema } from "@digipm/contracts/pm-os";
import { readAsset } from "../../assets/read-asset";
import { sourceFor, rememberSources } from "../../codex/store";
import { withRun } from "../runs/with-run";
import { recordStep } from "../runs/record-step";
import { workerRequest } from "./worker-request";
import { publishOutputs } from "./publish-outputs";
export async function runCode(
  userId: string,
  conversationId: string,
  runId: string,
  raw: unknown,
  signal: AbortSignal,
) {
  const input = codeTaskSchema.parse(raw);
  const files = input.files.map((file) => ({
    path: file.path,
    data: Buffer.from(file.content).toString("base64"),
  }));
  await withRun(
    userId,
    conversationId,
    runId,
    async (tx, _run, conversation) => {
      const sources = [];
      for (const assetId of [...new Set(input.assetIds)]) {
        const { asset, bytes } = await readAsset(userId, assetId);
        const target = await sourceFor(
          tx,
          userId,
          conversation.workspaceId,
          asset.pageId,
        );
        sources.push(target.source);
        files.push({
          path:
            "inputs/" +
            assetId +
            "/" +
            asset.name.replace(/[^a-zA-Z0-9._-]/g, "_"),
          data: bytes.toString("base64"),
        });
      }
      await rememberSources(tx, conversation, sources);
    },
  );
  signal.throwIfAborted();
  const id = createHash("sha256")
    .update(runId + ":" + input.key)
    .digest("hex");
  const step = { key: "code:" + input.key, kind: "code", label: input.title };
  await recordStep(userId, conversationId, runId, {
    ...step,
    status: "running",
  });
  try {
    await workerRequest(
      id,
      "PUT",
      { runtime: input.runtime, entrypoint: input.entrypoint, files },
      signal,
    );
    let result = await workerRequest(id, "GET", undefined, signal);
    while (result?.status === "running") {
      await delay(700, undefined, { signal });
      result = await workerRequest(id, "GET", undefined, signal);
    }
    signal.throwIfAborted();
    if (!result?.result || result.status === "failed")
      throw new Error(result?.error || "Calcul indisponible.");
    if (result.result.code !== 0) {
      await recordStep(userId, conversationId, runId, {
        ...step,
        status: "failed",
        detail: result.result.stderr.slice(0, 1000),
      });
      return {
        error:
          "Le programme n’a pas abouti. Corriger le code puis utiliser une nouvelle key.",
        stdout: result.result.stdout,
        stderr: result.result.stderr,
      };
    }
    const artifacts = await publishOutputs(
      userId,
      conversationId,
      runId,
      input,
      result.result.files,
      signal,
    );
    await recordStep(userId, conversationId, runId, {
      ...step,
      status: "completed",
      detail: artifacts.length + " fichier(s) créé(s)",
    });
    return {
      stdout: result.result.stdout,
      stderr: result.result.stderr,
      artifacts,
    };
  } catch (error) {
    if (signal.aborted) await workerRequest(id, "DELETE").catch(() => {});
    await recordStep(userId, conversationId, runId, {
      ...step,
      status: "failed",
      detail: signal.aborted
        ? "Calcul interrompu."
        : error instanceof Error
          ? error.message.slice(0, 1000)
          : "Calcul indisponible.",
    }).catch(() => {});
    throw error;
  }
}
