import { RPCHandler } from "@orpc/server/fetch";
import {
  BatchHandlerPlugin,
  StrictGetMethodPlugin,
} from "@orpc/server/plugins";
import { createFileRoute } from "@tanstack/react-router";
import { MAX_ARCHIVE_BYTES, MAX_RPC_BODY_BYTES } from "@/constants/limits";
import { db } from "@/db";
import { isSameOrigin } from "@/server/lib/assert-same-origin";
import { readRequestBytes } from "@/server/lib/read-request-bytes";
import { withRequestLog } from "@/server/lib/request-log";
import { appRouter } from "@/server/routers/_app";

const PREFIX = "/api/rpc";

const handler = new RPCHandler(appRouter, {
  plugins: [new StrictGetMethodPlugin(), new BatchHandlerPlugin()],
});

/** Archive imports carry the 16 Mo archive plus its JSON envelope. */
const bodyLimit = (pathname: string) =>
  pathname === `${PREFIX}/transfer/import`
    ? MAX_ARCHIVE_BYTES + MAX_RPC_BODY_BYTES
    : MAX_RPC_BODY_BYTES;

async function boundedRequest(request: Request) {
  if (request.method === "GET") {
    return request;
  }
  if (!isSameOrigin(request)) {
    return new Response("Forbidden", { status: 403 });
  }
  const max = bodyLimit(new URL(request.url).pathname);
  if (Number(request.headers.get("content-length")) > max) {
    return new Response("Payload too large", { status: 413 });
  }
  const body = await readRequestBytes(request, max);
  if (!body.ok) {
    return new Response("Payload too large", { status: 413 });
  }
  return new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: body.bytes.slice(),
  });
}

function handle({ request }: { request: Request }) {
  return withRequestLog(request, "rpc", async () => {
    const bounded = await boundedRequest(request);
    if (bounded instanceof Response) {
      return bounded;
    }
    const { response } = await handler.handle(bounded, {
      prefix: PREFIX,
      context: { headers: request.headers, db },
    });
    return response ?? new Response("Not found", { status: 404 });
  });
}

export const Route = createFileRoute("/api/rpc/$")({
  server: {
    handlers: {
      ANY: handle,
    },
  },
});
