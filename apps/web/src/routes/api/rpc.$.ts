import { createFileRoute } from "@tanstack/react-router";
import { RPCHandler } from "@orpc/server/fetch";
import { router } from "@digipm/server";
const handler = new RPCHandler(router);
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
        const max =
          new URL(request.url).pathname === "/api/rpc/transfer/import"
            ? 18 * 1024 * 1024
            : 3 * 1024 * 1024;
        if (Number(request.headers.get("content-length")) > max)
          return new Response("Payload too large", { status: 413 });
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
              return new Response("Payload too large", { status: 413 });
            }
            chunks.push(value);
          }
        const body = new Uint8Array(size);
        let at = 0;
        for (const chunk of chunks) {
          body.set(chunk, at);
          at += chunk.length;
        }
        const started = performance.now();
        const id = crypto.randomUUID();
        const { response } = await handler.handle(
          new Request(request.url, {
            method: "POST",
            headers: request.headers,
            body,
          }),
          { prefix: "/api/rpc", context: { headers: request.headers } },
        );
        const result = response ?? new Response("Not found", { status: 404 });
        result.headers.set("X-Request-Id", id);
        result.headers.set("Cache-Control", "no-store");
        if (process.env.LOG_REQUESTS === "true")
          console.info(
            JSON.stringify({
              event: "rpc",
              requestId: id,
              procedure: new URL(request.url).pathname
                .replace(/[^a-zA-Z/]/g, "")
                .slice(0, 100),
              status: result.status,
              durationMs: Math.round(performance.now() - started),
            }),
          );
        return result;
      },
    },
  },
});
