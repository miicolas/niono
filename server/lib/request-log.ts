import { env } from "@/env/server";

const PROCEDURE_CHARS = /[^a-zA-Z/]/g;
const MAX_PROCEDURE_LENGTH = 100;

/** Exécute le handler, ajoute X-Request-Id et no-store, journalise si LOG_REQUESTS est actif. */
export async function withRequestLog(
  request: Request,
  event: string,
  run: () => Promise<Response>
) {
  const started = performance.now();
  const id = crypto.randomUUID();
  const response = await run();
  response.headers.set("X-Request-Id", id);
  response.headers.set("Cache-Control", "no-store");
  if (env.LOG_REQUESTS === "true") {
    console.info(
      JSON.stringify({
        event,
        requestId: id,
        procedure: new URL(request.url).pathname
          .replace(PROCEDURE_CHARS, "")
          .slice(0, MAX_PROCEDURE_LENGTH),
        status: response.status,
        durationMs: Math.round(performance.now() - started),
      })
    );
  }
  return response;
}
