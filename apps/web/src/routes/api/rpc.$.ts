import { createFileRoute } from "@tanstack/react-router";
import { RPCHandler } from "@orpc/server/fetch";
import { router } from "@digipm/server";
import { MAX_ARCHIVE_BYTES, MAX_RPC_BODY_BYTES } from "@digipm/contracts";
const handler = new RPCHandler(router);
const PREFIX = "/api/rpc";
/** Archive imports carry the 16 Mo archive plus its JSON envelope. */
const bodyLimit = (pathname: string) =>
  pathname === `${PREFIX}/transfer/import`
    ? MAX_ARCHIVE_BYTES + MAX_RPC_BODY_BYTES
    : MAX_RPC_BODY_BYTES;
async function readBody(request: Request, max: number) {
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader)
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > max) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  const body = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    body.set(chunk, at);
    at += chunk.length;
  }
  return body;
}
export const Route = createFileRoute("/api/rpc/$")({
  server: {
    handlers: {
      ANY: async ({ request }) => {
        if (request.method !== "POST")
          return new Response("Method not allowed", {
            status: 405,
            headers: { Allow: "POST" },
          });
        if (
          request.headers.get("origin") !==
          new URL(process.env.BETTER_AUTH_URL ?? request.url).origin
        )
          return new Response("Forbidden", { status: 403 });
        const pathname = new URL(request.url).pathname;
        const max = bodyLimit(pathname);
        if (Number(request.headers.get("content-length")) > max)
          return new Response("Payload too large", { status: 413 });
        const body = await readBody(request, max);
        if (!body) return new Response("Payload too large", { status: 413 });
        const started = performance.now();
        const id = crypto.randomUUID();
        const { response } = await handler.handle(
          new Request(request.url, {
            method: "POST",
            headers: request.headers,
            body,
          }),
          { prefix: PREFIX, context: { headers: request.headers } },
        );
        const result = response ?? new Response("Not found", { status: 404 });
        result.headers.set("X-Request-Id", id);
        result.headers.set("Cache-Control", "no-store");
        if (process.env.LOG_REQUESTS === "true")
          console.info(
            JSON.stringify({
              event: "rpc",
              requestId: id,
              procedure: pathname.replace(/[^a-zA-Z/]/g, "").slice(0, 100),
              status: result.status,
              durationMs: Math.round(performance.now() - started),
            }),
          );
        return result;
      },
    },
  },
});
