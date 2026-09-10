import { db, schema as s } from "@digipm/db";
import { changeFeed, type DatabaseChange } from "@digipm/db/change-feed";
import { eq, and, gt } from "drizzle-orm";
import { auth } from "../auth";
import { accessPage, workspaceRole } from "../access";
import { readPresence } from "./read-presence";
import { z } from "zod";
import { ORPCError } from "@orpc/server";

export async function realtimeStream(request: Request) {
  const origin = new URL(process.env.BETTER_AUTH_URL ?? request.url).origin;
  if (request.headers.get("origin") && request.headers.get("origin") !== origin)
    return new Response("Forbidden", { status: 403 });
  const parsed = z
    .object({ workspaceId: z.uuid(), pageId: z.uuid().optional() })
    .safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return new Response("Bad request", { status: 400 });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new Response("Unauthorized", { status: 401 });
  const { workspaceId, pageId } = parsed.data;
  const authorize = async () => {
    const [active] = await db
      .select({ id: s.session.id })
      .from(s.session)
      .where(
        and(
          eq(s.session.id, session.session.id),
          gt(s.session.expiresAt, new Date()),
        ),
      );
    if (!active) throw new ORPCError("UNAUTHORIZED");
    await workspaceRole(db, session.user.id, workspaceId);
    if (pageId) {
      const { page } = await accessPage(db, session.user.id, pageId);
      if (page.workspaceId !== workspaceId) throw new ORPCError("FORBIDDEN");
    }
  };
  try {
    await authorize();
  } catch (error) {
    return new Response("Unavailable", {
      status: error instanceof ORPCError ? 403 : 503,
    });
  }
  let cleanup = () => {};
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      let unsubscribe: (() => void) | undefined;
      let timer: ReturnType<typeof setInterval> | undefined;
      let queue = Promise.resolve();
      const pending = new Set<string>();
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        if (closed) return;
        if ((controller.desiredSize ?? 0) < -20) {
          cleanup();
          return;
        }
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };
      const fail = (error: unknown) => {
        send(error instanceof ORPCError ? "revoked" : "retry", {});
        cleanup();
      };
      cleanup = () => {
        if (closed) return;
        closed = true;
        unsubscribe?.();
        clearInterval(timer);
        request.signal.removeEventListener("abort", cleanup);
        try {
          controller.close();
        } catch {
          /* Consumer already cancelled. */
        }
      };
      request.signal.addEventListener("abort", cleanup, { once: true });
      const deliver = (change: DatabaseChange) => {
        if (
          closed ||
          (change.workspaceId && change.workspaceId !== workspaceId) ||
          (change.userId && change.userId !== session.user.id)
        )
          return;
        const key = `${change.table}:${!change.pageId || change.pageId === pageId ? "open" : "other"}`;
        if (pending.has(key)) return;
        pending.add(key);
        queue = queue
          .then(async () => {
            pending.delete(key);
            if (closed) return;
            await authorize();
            if (change.table === "realtime_presence") {
              if (pageId && change.pageId === pageId)
                send("presence", await readPresence(session.user.id, pageId));
            } else {
              // No private page identifiers or row contents travel through invalidations.
              send("change", { table: change.table });
              if (pageId && (!change.pageId || change.pageId === pageId))
                send("document", {});
            }
          })
          .catch(fail);
      };
      try {
        unsubscribe = await changeFeed.subscribe(deliver);
        if (closed) {
          unsubscribe();
          return;
        }
        await authorize();
        send("ready", {});
        if (pageId)
          send("presence", await readPresence(session.user.id, pageId));
        timer = setInterval(() => {
          queue = queue
            .then(async () => {
              if (closed) return;
              await authorize();
              send("heartbeat", {});
              if (pageId)
                send("presence", await readPresence(session.user.id, pageId));
            })
            .catch(fail);
        }, 10000);
        if (request.signal.aborted) cleanup();
      } catch {
        send("retry", {});
        cleanup();
      }
    },
    cancel() {
      cleanup();
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
