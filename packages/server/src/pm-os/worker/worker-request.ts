import { z } from "zod";
export const workerResultSchema = z.object({
  status: z.enum(["running", "completed", "failed"]),
  error: z.string().max(5000).optional(),
  result: z
    .object({
      code: z.number().nullable(),
      stdout: z.string().max(30000),
      stderr: z.string().max(30000),
      files: z
        .array(
          z.object({
            path: z.string().max(200),
            data: z.string().max(28000000),
          }),
        )
        .max(50),
    })
    .optional(),
});
export async function workerRequest(
  id: string,
  method: "PUT" | "GET" | "DELETE",
  body?: unknown,
  signal?: AbortSignal,
) {
  const endpoint = process.env.PM_WORKER_URL;
  const token = process.env.PM_WORKER_TOKEN;
  if (!endpoint || !token)
    throw new Error(
      "Le worker de calcul n’est pas configuré. La création de documents reste disponible.",
    );
  const response = await fetch(endpoint.replace(/\/$/, "") + "/jobs/" + id, {
    method,
    headers: {
      authorization: "Bearer " + token,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(30000)])
      : AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? "Le worker exécute déjà trois calculs. Réessayez après leur fin."
        : "Le worker a refusé ce calcul (" + response.status + ").",
    );
  const text = await response.text();
  if (text.length > 75000000)
    throw new Error("Résultat du worker trop volumineux.");
  return method === "DELETE"
    ? null
    : workerResultSchema.parse(JSON.parse(text));
}
